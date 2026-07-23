'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { agentProblems, aishiSolutions } from './landingData';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function ProblemsAndSolutionsSection() {
  const { theme } = useTheme();
  const [hoveredProblem, setHoveredProblem] = useState<number | null>(null);
  const [hoveredSolution, setHoveredSolution] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 480);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <section style={{
      padding: isMobile ? '60px 16px' : '100px 20px',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Problems Section */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{
            fontSize: isSmallMobile ? '1.5rem' : 'clamp(1.75rem, 3.5vw, 2.5rem)',
            fontWeight: 'bold',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <span style={{ color: theme.text.secondary }}>
              Problems most agents have
            </span>
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isSmallMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isSmallMobile ? '12px' : '16px',
            marginTop: '40px'
          }}>
            {agentProblems.map((problem, i) => (
              <div
                key={i}
                style={{
                  padding: isSmallMobile ? '16px' : '20px',
                  background: hoveredProblem === i 
                    ? 'rgba(239, 68, 68, 0.05)' 
                    : 'rgba(24, 24, 31, 0.4)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${hoveredProblem === i ? 'rgba(239, 68, 68, 0.3)' : theme.border}`,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredProblem(i)}
                onMouseLeave={() => setHoveredProblem(null)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertCircle 
                    size={20} 
                    style={{ 
                      color: 'rgba(239, 68, 68, 0.7)',
                      flexShrink: 0,
                      marginTop: '2px'
                    }} 
                  />
                  <div>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: theme.text.primary,
                      marginBottom: '6px'
                    }}>
                      {problem.title}
                    </h4>
                    <p style={{
                      fontSize: '0.9rem',
                      color: theme.text.secondary,
                      lineHeight: 1.4
                    }}>
                      {problem.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Solutions Section */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{
            fontSize: isSmallMobile ? '1.75rem' : 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 'bold',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <span style={{
              background: theme.gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              What Aishi solves
            </span>
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isSmallMobile ? '1fr' : isMobile ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: isSmallMobile ? '16px' : '24px',
            marginTop: '40px'
          }}>
            {aishiSolutions.map((solution, i) => (
              <div
                key={i}
                style={{
                  padding: isSmallMobile ? '20px' : '28px',
                  background: hoveredSolution === i 
                    ? 'rgba(139, 92, 246, 0.08)' 
                    : 'rgba(24, 24, 31, 0.4)',
                  backdropFilter: 'blur(10px)',
                  border: `2px solid ${hoveredSolution === i ? theme.accent.primary : theme.border}`,
                  borderRadius: '16px',
                  transition: 'all 0.3s ease',
                  transform: hoveredSolution === i ? 'translateY(-4px)' : 'translateY(0)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => setHoveredSolution(i)}
                onMouseLeave={() => setHoveredSolution(null)}
              >
                {/* Gradient border effect on hover */}
                {hoveredSolution === i && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: theme.gradients.primary
                  }} />
                )}
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <CheckCircle 
                    size={24} 
                    style={{ 
                      color: theme.accent.primary,
                      flexShrink: 0,
                      marginTop: '2px'
                    }} 
                  />
                  <div>
                    <h4 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: theme.text.primary,
                      marginBottom: '8px'
                    }}>
                      {solution.title}
                    </h4>
                    <p style={{
                      fontSize: '0.95rem',
                      color: theme.text.secondary,
                      lineHeight: 1.5
                    }}>
                      {solution.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}