// src/utils/analytics.js
// This file tracks user activity and feature usage for the admin dashboard

import { db } from '../firebase';
import { doc, setDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ============================================
// TRACK FEATURE USAGE
// ============================================
export const trackFeatureUsage = async (featureName) => {
  try {
    const statsRef = doc(db, 'system_stats', 'feature_usage');
    
    const featureKey = featureName.toLowerCase().replace(/\s+/g, '');
    
    await updateDoc(statsRef, {
      [featureKey]: increment(1),
      lastUpdated: serverTimestamp()
    }).catch(async (error) => {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        await setDoc(statsRef, {
          frauddetector: featureName === 'Fraud Detector' ? 1 : 0,
          atsscorer: featureName === 'ATS Scorer' ? 1 : 0,
          jobmatcher: featureName === 'Job Matcher' ? 1 : 0,
          resumebuilder: featureName === 'Resume Builder' ? 1 : 0,
          lastUpdated: serverTimestamp()
        });
      }
    });
  } catch (error) {
    console.error('Error tracking feature usage:', error);
  }
};

// ============================================
// LOG RECENT ACTIVITY
// ============================================
export const logActivity = async (type, action, email = 'Anonymous User') => {
  try {
    const activityRef = collection(db, 'recent_activity');
    
    await addDoc(activityRef, {
      type, // 'user', 'fraud', 'resume', 'ats'
      action,
      email,
      time: 'Just now',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// ============================================
// UPDATE SYSTEM STATS
// ============================================
export const updateSystemStats = async (statType) => {
  try {
    const statsRef = doc(db, 'system_stats', 'overview');
    
    const updates = {};
    
    switch(statType) {
      case 'user_registered':
        updates.totalUsers = increment(1);
        break;
      case 'resume_analyzed':
        updates.totalResumes = increment(1);
        break;
      case 'fraud_detected':
        updates.fraudDetections = increment(1);
        break;
      case 'ats_scan':
        updates.atsScans = increment(1);
        break;
      default:
        break;
    }
    
    updates.lastUpdated = serverTimestamp();
    
    await updateDoc(statsRef, updates).catch(async (error) => {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        await setDoc(statsRef, {
          totalUsers: statType === 'user_registered' ? 1 : 0,
          totalResumes: statType === 'resume_analyzed' ? 1 : 0,
          fraudDetections: statType === 'fraud_detected' ? 1 : 0,
          atsScans: statType === 'ats_scan' ? 1 : 0,
          activeUsers: 0,
          lastUpdated: serverTimestamp()
        });
      }
    });
  } catch (error) {
    console.error('Error updating system stats:', error);
  }
};

// ============================================
// TRACK USER GROWTH (Call this daily or on user registration)
// ============================================
export const trackUserGrowth = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const growthRef = doc(db, 'user_growth', today);
    
    await updateDoc(growthRef, {
      count: increment(1),
      date: today
    }).catch(async (error) => {
      if (error.code === 'not-found') {
        await setDoc(growthRef, {
          count: 1,
          date: today
        });
      }
    });
  } catch (error) {
    console.error('Error tracking user growth:', error);
  }
};

