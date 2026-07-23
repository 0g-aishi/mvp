/**
 * @fileoverview SQLite database service for managing virtual brokers and transactions
 * @description Provides a centralized database interface for broker accounts, balance management,
 * transaction history, and consolidation status tracking. Uses better-sqlite3 for synchronous
 * database operations with automatic table initialization and migration support.
 */

const { existsSync, mkdirSync } = require('fs');
const { dirname } = require('path');
require('../config/envLoader');
const { createLogger } = require('../lib/logger');

const log = createLogger('Database');

type SqliteStatement = {
  run: (...params: unknown[]) => { changes: number; lastInsertRowid: number | bigint };
  get: (...params: unknown[]) => unknown;
  all: (...params: unknown[]) => unknown[];
};

type SqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
  close: () => void;
};

function openSqlite(filePath: string): SqliteDatabase {
  try {
    // Node 22.13+ / 24: no native addon, so `npm install` works on this machine.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require('node:sqlite');
    log.info('SQLite driver: node:sqlite');
    return new DatabaseSync(filePath);
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const BetterSqlite3 = require('better-sqlite3');
      log.info('SQLite driver: better-sqlite3');
      return new BetterSqlite3(filePath);
    } catch {
      throw new Error(
        'SQLite unavailable. Use Node.js 22+ or run `npm run rebuild:sqlite` after installing Python and VS Build Tools.'
      );
    }
  }
}

interface UserBroker {
  id?: number;
  walletAddress: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  consolidation_date: string;
  month_learn: 'need' | 'noneed';
  year_learn: 'need' | 'noneed';
}

interface Transaction {
  id?: number;
  walletAddress: string;
  type: 'deposit' | 'withdrawal' | 'ai_query';
  amount: number;
  description: string;
  txHash?: string;
  createdAt: string;
}

class DatabaseService {
  private db: SqliteDatabase;

  constructor() {
    const databaseFilePath = process.env.DATABASE_PATH || './data/brokers.db';
    
    const databaseDirectory = dirname(databaseFilePath);
    if (!existsSync(databaseDirectory)) {
      mkdirSync(databaseDirectory, { recursive: true });
    }

    this.db = openSqlite(databaseFilePath);
    this.initializeTables();

    if (process.env.TEST_ENV === 'true') {
      log.info('Database initialized', { path: databaseFilePath });
    }
  }

  private addConsolidationColumns(): void {
    // Check if consolidation columns exist, if not add them
    try {
      const tableInfo = this.db.prepare('PRAGMA table_info(user_brokers)').all() as Array<{ name: string; type: string; notnull: number; dflt_value: any; pk: number }>;
      const columnNames = tableInfo.map(col => col.name);
      
      if (!columnNames.includes('consolidation_date')) {
        // SQLite doesn't support CURRENT_TIMESTAMP as default in ALTER TABLE
        // First add column without default
        this.db.exec(`
          ALTER TABLE user_brokers 
          ADD COLUMN consolidation_date TEXT
        `);
        
        this.db.exec(`
          UPDATE user_brokers 
          SET consolidation_date = datetime('now') 
          WHERE consolidation_date IS NULL
        `);


        if (process.env.TEST_ENV === 'true') {
          log.info('Added consolidation_date column to user_brokers');
        }
      }
      
      if (!columnNames.includes('month_learn')) {
        this.db.exec(`
          ALTER TABLE user_brokers 
          ADD COLUMN month_learn TEXT DEFAULT 'noneed'
        `);
        
        this.db.exec(`
          UPDATE user_brokers 
          SET month_learn = 'noneed' 
          WHERE month_learn IS NULL
        `);


        if (process.env.TEST_ENV === 'true') {
          log.info('Added month_learn column to user_brokers');
        }
      }
      
      if (!columnNames.includes('year_learn')) {
        this.db.exec(`
          ALTER TABLE user_brokers 
          ADD COLUMN year_learn TEXT DEFAULT 'noneed'
        `);
        
        this.db.exec(`
          UPDATE user_brokers 
          SET year_learn = 'noneed' 
          WHERE year_learn IS NULL
        `);


        if (process.env.TEST_ENV === 'true') {
          log.info('Added year_learn column to user_brokers');
        }
      }
    } catch (error) {
      if (process.env.TEST_ENV === 'true') {
        log.error('Error adding consolidation columns', { error });
      }
    }
  }

  private initializeTables(): void {
    // Create user_brokers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_brokers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        walletAddress TEXT UNIQUE NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        consolidation_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        month_learn TEXT NOT NULL DEFAULT 'noneed' CHECK (month_learn IN ('need', 'noneed')),
        year_learn TEXT NOT NULL DEFAULT 'noneed' CHECK (year_learn IN ('need', 'noneed'))
      )
    `);

    // Create transactions table for audit trail
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        walletAddress TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'ai_query')),
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        txHash TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to existing tables if they don't exist
    this.addConsolidationColumns();

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_brokers_wallet 
      ON user_brokers(walletAddress)
    `);
    
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_wallet
      ON transactions(walletAddress)
    `);

    if (process.env.TEST_ENV === 'true') {
      log.info('Database tables initialized');
    }
  }

  // User Broker Management
  createBroker(walletAddress: string): UserBroker {
    const stmt = this.db.prepare(`
      INSERT INTO user_brokers (walletAddress, balance, createdAt, updatedAt, consolidation_date, month_learn, year_learn) 
      VALUES (?, 0, datetime('now'), datetime('now'), datetime('now'), 'noneed', 'noneed')
    `);
    
    try {
      const result = stmt.run(walletAddress);

      if (process.env.TEST_ENV === 'true') {
        log.info('Created broker for wallet', { walletAddress });
      }

      return this.getBroker(walletAddress)!;
    } catch (error: any) {
      const message = String(error?.message || '');
      if (
        error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        error.code === 'ERR_SQLITE_CONSTRAINT' ||
        message.includes('UNIQUE')
      ) {
        throw new Error(`Broker already exists for wallet: ${walletAddress}`);
      }
      throw error;
    }
  }

  getBroker(walletAddress: string): UserBroker | null {
    const stmt = this.db.prepare(`
      SELECT * FROM user_brokers WHERE walletAddress = ?
    `);
    
    return stmt.get(walletAddress) as UserBroker | null;
  }

  updateBalance(walletAddress: string, newBalance: number): void {
    const stmt = this.db.prepare(`
      UPDATE user_brokers 
      SET balance = ?, updatedAt = datetime('now') 
      WHERE walletAddress = ?
    `);
    
    const result = stmt.run(newBalance, walletAddress);
    
    if (result.changes === 0) {
      throw new Error(`No broker found for wallet: ${walletAddress}`);
    }

    if (process.env.TEST_ENV === 'true') {
      log.info('Updated balance', { walletAddress, balance: newBalance.toFixed(8) });
    }
  }

  addToBalance(walletAddress: string, amount: number): number {
    const broker = this.getBroker(walletAddress);
    if (!broker) {
      throw new Error(`No broker found for wallet: ${walletAddress}`);
    }
    
    const newBalance = broker.balance + amount;
    this.updateBalance(walletAddress, newBalance);
    
    return newBalance;
  }

  subtractFromBalance(walletAddress: string, amount: number): number {
    const broker = this.getBroker(walletAddress);
    if (!broker) {
      throw new Error(`No broker found for wallet: ${walletAddress}`);
    }
    
    if (broker.balance < amount) {
      throw new Error(`Insufficient balance. Required: ${amount}, Available: ${broker.balance}`);
    }
    
    const newBalance = broker.balance - amount;
    this.updateBalance(walletAddress, newBalance);
    
    return newBalance;
  }

  // Transaction Management
  addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (walletAddress, type, amount, description, txHash, createdAt) 
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    
    const result = stmt.run(
      transaction.walletAddress,
      transaction.type,
      transaction.amount,
      transaction.description,
      transaction.txHash || null
    );
    
    const newTransaction: Transaction = {
      id: result.lastInsertRowid as number,
      ...transaction,
      createdAt: new Date().toISOString()
    };

    if (process.env.TEST_ENV === 'true') {
      log.info('Added transaction', { type: transaction.type, amount: transaction.amount.toFixed(8), wallet: transaction.walletAddress });
    }

    return newTransaction;
  }

  getTransactions(walletAddress: string, limit: number = 10): Transaction[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions 
      WHERE walletAddress = ? 
      ORDER BY createdAt DESC 
      LIMIT ?
    `);
    
    return stmt.all(walletAddress, limit) as Transaction[];
  }

  // Consolidation Management
  updateConsolidationStatus(walletAddress: string, monthLearn?: 'need' | 'noneed', yearLearn?: 'need' | 'noneed'): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (monthLearn) {
      updates.push('month_learn = ?');
      values.push(monthLearn);
    }
    
    if (yearLearn) {
      updates.push('year_learn = ?');
      values.push(yearLearn);
    }
    
    if (updates.length === 0) return;

    updates.push('updatedAt = datetime(\'now\')');
    values.push(walletAddress);

    const stmt = this.db.prepare(`
      UPDATE user_brokers 
      SET ${updates.join(', ')} 
      WHERE walletAddress = ?
    `);
    
    const result = stmt.run(...values);
    
    if (result.changes === 0) {
      throw new Error(`No broker found for wallet: ${walletAddress}`);
    }

    if (process.env.TEST_ENV === 'true') {
      log.info('Updated consolidation status', { walletAddress, month: monthLearn, year: yearLearn });
    }
  }

  getConsolidationStatus(walletAddress: string): { consolidation_date: string; month_learn: string; year_learn: string } | null {
    const stmt = this.db.prepare(`
      SELECT consolidation_date, month_learn, year_learn 
      FROM user_brokers 
      WHERE walletAddress = ?
    `);
    
    return stmt.get(walletAddress) as { consolidation_date: string; month_learn: string; year_learn: string } | null;
  }

  getAllBrokersForConsolidationCheck(): Array<{ walletAddress: string; consolidation_date: string; month_learn: string; year_learn: string }> {
    const stmt = this.db.prepare(`
      SELECT walletAddress, consolidation_date, month_learn, year_learn 
      FROM user_brokers
    `);
    
    return stmt.all() as Array<{ walletAddress: string; consolidation_date: string; month_learn: string; year_learn: string }>;
  }

  // Statistics
  getTotalBrokers(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM user_brokers`);
    return (stmt.get() as any).count;
  }

  getTotalBalance(): number {
    const stmt = this.db.prepare(`SELECT SUM(balance) as total FROM user_brokers`);
    const result = stmt.get() as any;
    return result.total || 0;
  }

  // Cleanup
  close(): void {
    this.db.close();
  }
}

module.exports = new DatabaseService(); 