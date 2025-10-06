import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

const HeroIllustration = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxWidth: '500px', maxHeight: '500px' }}>

        {/* Background circles - decorative */}
        <motion.circle
          cx="450"
          cy="150"
          r="100"
          fill="#FFE5E8"
          opacity="0.4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <motion.circle
          cx="150"
          cy="450"
          r="80"
          fill="#E1F5FE"
          opacity="0.4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Main document/form illustration */}
        <motion.g
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}>
          <rect
            x="150"
            y="120"
            width="300"
            height="380"
            rx="12"
            fill="white"
            stroke="#E0E0E0"
            strokeWidth="2"
          />

          {/* Document header with Swiss cross inspiration */}
          <rect
            x="150"
            y="120"
            width="300"
            height="60"
            rx="12"
            fill="#DC0018"
          />
          <rect
            x="150"
            y="165"
            width="300"
            height="15"
            fill="#DC0018"
          />

          {/* Swiss cross element */}
          <rect x="200" y="135" width="8" height="30" fill="white" rx="2"/>
          <rect x="189" y="146" width="30" height="8" fill="white" rx="2"/>

          {/* Document title text lines */}
          <rect x="240" y="140" width="180" height="8" rx="4" fill="white" opacity="0.9"/>
          <rect x="240" y="155" width="140" height="6" rx="3" fill="white" opacity="0.7"/>

          {/* Form fields */}
          <rect x="180" y="210" width="240" height="12" rx="6" fill="#F5F5F5"/>
          <rect x="180" y="235" width="180" height="12" rx="6" fill="#F5F5F5"/>
          <rect x="180" y="260" width="200" height="12" rx="6" fill="#F5F5F5"/>

          {/* Currency/numbers */}
          <text x="190" y="305" fill="#1A1A1A" fontSize="16" fontWeight="600" fontFamily="Inter, sans-serif">
            CHF
          </text>
          <rect x="230" y="290" width="180" height="20" rx="8" fill="#FFE5E8"/>
          <text x="250" y="305" fill="#DC0018" fontSize="18" fontWeight="700" fontFamily="Inter, sans-serif">
            12,450.00
          </text>
        </motion.g>

        {/* Calculator icon */}
        <motion.g
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}>
          <rect
            x="80"
            y="280"
            width="100"
            height="140"
            rx="8"
            fill="white"
            stroke="#003DA5"
            strokeWidth="3"
          />
          <rect x="80" y="280" width="100" height="35" rx="8" fill="#003DA5"/>
          <rect x="95" y="292" width="70" height="12" rx="4" fill="white" opacity="0.9"/>

          {/* Calculator buttons */}
          <rect x="95" y="330" width="20" height="18" rx="4" fill="#F5F5F5"/>
          <rect x="120" y="330" width="20" height="18" rx="4" fill="#F5F5F5"/>
          <rect x="145" y="330" width="20" height="18" rx="4" fill="#F5F5F5"/>

          <rect x="95" y="355" width="20" height="18" rx="4" fill="#F5F5F5"/>
          <rect x="120" y="355" width="20" height="18" rx="4" fill="#F5F5F5"/>
          <rect x="145" y="355" width="20" height="18" rx="4" fill="#F5F5F5"/>

          <rect x="95" y="380" width="20" height="18" rx="4" fill="#F5F5F5"/>
          <rect x="120" y="380" width="20" height="18" rx="4" fill="#F5F5F5"/>
          <rect x="145" y="380" width="20" height="18" rx="4" fill="#00A651"/>
        </motion.g>

        {/* Checkmark/success icon */}
        <motion.g
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.4, type: 'spring' }}>
          <circle cx="480" cy="380" r="40" fill="#00A651"/>
          <path
            d="M 460 380 L 472 392 L 500 364"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.g>

        {/* AI sparkle elements */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.8, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}>
          <circle cx="140" cy="200" r="3" fill="#6B46C1"/>
          <circle cx="470" cy="280" r="4" fill="#6B46C1"/>
          <circle cx="200" cy="520" r="3" fill="#6B46C1"/>
        </motion.g>

        {/* Decorative line elements */}
        <motion.path
          d="M 50 50 Q 100 80 150 50"
          stroke="#DC0018"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.path
          d="M 500 550 Q 520 520 550 540"
          stroke="#003DA5"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.6 }}
        />
      </svg>
    </Box>
  );
};

export default HeroIllustration;
