import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTasks } from '@/hooks/useTasks';

export function WeekNavigation() {
  const { currentWeekStart, goToPreviousWeek, goToNextWeek, goToCurrentWeek } = useTasks();

  const formatWeekRange = (weekStart: Date): string => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startStr = weekStart.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endStr = weekEnd.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${startStr} - ${endStr}`;
  };

  const isCurrentWeek = (): boolean => {
    const today = new Date();
    const thisWeekStart = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day;
    thisWeekStart.setDate(diff);
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const compareWeekStart = new Date(currentWeekStart);
    compareWeekStart.setHours(0, 0, 0, 0);
    
    return thisWeekStart.getTime() === compareWeekStart.getTime();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={goToPreviousWeek}
        style={styles.navButton}
      >
        <MaterialIcons name="chevron-left" size={24} color="#1976D2" />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={goToCurrentWeek}
        style={styles.weekContainer}
      >
        <Text style={styles.weekText}>
          {formatWeekRange(currentWeekStart)}
        </Text>
        {!isCurrentWeek() && (
          <Text style={styles.todayHint}>Tap to go to current week</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={goToNextWeek}
        style={styles.navButton}
      >
        <MaterialIcons name="chevron-right" size={24} color="#1976D2" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      },
    }),
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  weekContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  weekText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  todayHint: {
    fontSize: 11,
    color: '#1976D2',
    marginTop: 2,
  },
});