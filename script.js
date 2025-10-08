import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, Target, Zap } from 'lucide-react';

export default function SkillCheckTrainer() {
  const [rotation, setRotation] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState('');
  const [difficulty, setDifficulty] = useState('normal');
  const [mode, setMode] = useState('single');
  const [showDebug, setShowDebug] = useState(false);
  const [zonePosition, setZonePosition] = useState(0);
  const [continuousCount, setContinuousCount] = useState(0);
  const rotationRef = useRef(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // Difficulty settings
  const settings = {
    easy: { speed: 0.768, successZone: 50, greatZone: 10 },
    normal: { speed: 1.28, successZone: 40, greatZone: 8 },
    hard: { speed: 1.792, successZone: 30, greatZone: 6 }
  };
  
  const currentSettings = settings[difficulty];
  
  // Zone starts at top (0 degrees in canvas) or at random position
  const zoneStart = zonePosition;
  const zoneEnd = (zoneStart + currentSettings.successZone) % 360;
  const greatZoneStart = zoneStart;
  const greatZoneEnd = (zoneStart + currentSettings.greatZone) % 360;

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const newRotation = (elapsed * currentSettings.speed * 360 / 1000) % 360;
        rotationRef.current = newRotation;
        setRotation(newRotation);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, currentSettings.speed]);

  const startSkillCheck = () => {
    // Reset continuous count and score if starting fresh
    if (!isActive) {
      setContinuousCount(0);
      setScore(0);
      setAttempts(0);
    }
    
    setRotation(0);
    rotationRef.current = 0;
    setIsActive(true);
    setResult('');
    
    // Set zone position based on mode
    if (mode === 'random') {
      setZonePosition(Math.floor(Math.random() * 360));
    } else {
      setZonePosition(0);
    }
  };

  const isInZone = (angle, start, end) => {
    // Normalize angles to 0-360 range
    angle = angle % 360;
    start = start % 360;
    end = end % 360;
    
    // Handle wraparound at 360/0
    if (end < start) {
      return angle >= start || angle <= end;
    }
    return angle >= start && angle <= end;
  };

  const checkSkillCheck = () => {
    setAttempts(prev => prev + 1);
    
    const currentRotation = rotationRef.current;
    let hitSuccess = false;
    
    // Check if in success zone
    if (isInZone(currentRotation, zoneStart, zoneEnd)) {
      // Check if in great zone
      if (isInZone(currentRotation, greatZoneStart, greatZoneEnd)) {
        setResult('GREAT!');
        setScore(prev => prev + 2);
        hitSuccess = true;
      } else {
        setResult('Good');
        setScore(prev => prev + 1);
        hitSuccess = true;
      }
    } else {
      setResult('MISSED!');
    }
    
    // Auto-continue in continuous mode
    if ((mode === 'continuous' || mode === 'random') && hitSuccess) {
      const newCount = continuousCount + 1;
      setContinuousCount(newCount);
      
      // Seamlessly continue - place next zone 180-330 degrees ahead
      setTimeout(() => {
        setResult('');
        const offsetDegrees = 180 + Math.floor(Math.random() * 151); // 180 to 330
        const newZonePos = (zoneStart + offsetDegrees) % 360;
        setZonePosition(newZonePos);
      }, 300);
    } else if ((mode === 'continuous' || mode === 'random') && !hitSuccess) {
      // Stop on miss
      setIsActive(false);
    } else {
      // Single mode - always stop
      setIsActive(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.code === 'Space' && isActive) {
      e.preventDefault();
      checkSkillCheck();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, zoneStart, zoneEnd, greatZoneStart, greatZoneEnd, mode]);

  const accuracy = attempts > 0 ? ((score / (attempts * 2)) * 100).toFixed(1) : 0;

  // Draw the zones using canvas approach
  const drawZone = (startAngle, endAngle, color) => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    
    // Normalize angles
    const normalizedStart = startAngle % 360;
    const normalizedEnd = endAngle % 360;
    
    // Calculate arc length - handle wraparound
    let arcLength;
    if (normalizedEnd < normalizedStart) {
      // Zone wraps around 0
      arcLength = ((360 - normalizedStart + normalizedEnd) / 360) * circumference;
    } else {
      arcLength = ((normalizedEnd - normalizedStart) / 360) * circumference;
    }
    
    const startOffset = (normalizedStart / 360) * circumference;
    
    return (
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeDashoffset={-startOffset}
        transform="rotate(-90 50 50)"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-500 mb-2 flex items-center justify-center gap-2">
            <Target className="w-8 h-8" />
            Skill Check Trainer
          </h1>
          <p className="text-gray-400">Press SPACE when the needle is in the white zone!</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 shadow-2xl mb-6">
          <div className="relative w-80 h-80 mx-auto mb-8">
            {/* Outer circle */}
            <div className="absolute inset-0 rounded-full border-8 border-gray-700"></div>
            
            {/* Zones */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* Success zone (white) */}
              {drawZone(zoneStart, zoneEnd, 'rgba(255, 255, 255, 0.6)')}
              {/* Great zone (red) */}
              {drawZone(greatZoneStart, greatZoneEnd, '#ef4444')}
            </svg>
            
            {/* Needle */}
            <div 
              className="absolute top-1/2 left-1/2 w-1 h-36 bg-white origin-bottom transition-none"
              style={{
                transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
                boxShadow: '0 0 10px rgba(255,255,255,0.8)',
                willChange: 'transform'
              }}
            ></div>
            
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Result text */}
            {result && (
              <div className={`absolute inset-0 flex items-center justify-center text-4xl font-bold ${
                result === 'GREAT!' ? 'text-red-500' : 
                result === 'Good' ? 'text-white' : 
                'text-red-700'
              }`}>
                {result}
              </div>
            )}
            
            {/* Debug info */}
            {showDebug && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                Angle: {rotation.toFixed(1)}° | Zone: {zoneStart}°-{zoneEnd}°
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={startSkillCheck}
              disabled={isActive}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <RotateCw className="w-5 h-5" />
              {isActive ? 'In Progress...' : 'Start Skill Check'}
            </button>
            
            {isActive && (
              <button
                onClick={checkSkillCheck}
                className="px-6 py-3 bg-white hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Hit! (SPACE)
              </button>
            )}
          </div>

          <div className="flex gap-4 justify-center mb-4">
            <label className="text-gray-300">Difficulty:</label>
            {['easy', 'normal', 'hard'].map(d => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  setIsActive(false);
                }}
                disabled={isActive}
                className={`px-4 py-1 rounded ${
                  difficulty === d 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50 capitalize`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex gap-4 justify-center mb-4">
            <label className="text-gray-300">Mode:</label>
            {[
              { value: 'single', label: 'Single' },
              { value: 'continuous', label: 'Continuous' },
              { value: 'random', label: 'Random Zone' }
            ].map(m => (
              <button
                key={m.value}
                onClick={() => {
                  setMode(m.value);
                  setIsActive(false);
                }}
                disabled={isActive}
                className={`px-4 py-1 rounded ${
                  mode === m.value 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              {showDebug ? 'Hide' : 'Show'} Debug Info
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-700 rounded p-4">
              <div className="text-2xl font-bold text-white">{score}</div>
              <div className="text-sm text-gray-400">Score</div>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <div className="text-2xl font-bold text-white">{attempts}</div>
              <div className="text-sm text-gray-400">Attempts</div>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <div className="text-2xl font-bold text-white">{accuracy}%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </div>
          </div>
          
          {(mode === 'continuous' || mode === 'random') && isActive && (
            <div className="mt-4 text-center">
              <div className="text-gray-400 text-sm">
                Streak: {continuousCount}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-4 text-gray-300 text-sm">
          <h3 className="font-semibold mb-2">Tips:</h3>
          <ul className="space-y-1">
            <li>• Hit SPACE when the needle enters the WHITE zone for a Good skill check</li>
            <li>• Hit SPACE when the needle is in the RED zone for a Great skill check (bonus!)</li>
            <li>• Start with Easy difficulty and work your way up</li>
            <li>• Use Continuous mode for non-stop practice</li>
            <li>• Use Random Zone mode for realistic game-like training</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
