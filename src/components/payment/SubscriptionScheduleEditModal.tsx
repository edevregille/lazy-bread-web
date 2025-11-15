'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { updateSubscriptionSchedule } from '@/lib/firebaseService';
import { BUSINESS_SETTINGS, getDayNumber } from '@/config/app-config';
import { Subscription } from '@/lib/types';

interface SubscriptionScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onScheduleUpdated: () => void;
}

// Get PST date components
function getPSTDateComponents(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
  
  const year = parseInt(getPart('year'), 10);
  const month = parseInt(getPart('month'), 10) - 1; // JavaScript months are 0-indexed
  const day = parseInt(getPart('day'), 10);
  
  // Get weekday in PST
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
  });
  const weekdayName = weekdayFormatter.format(date).toLowerCase();
  const dayNameToNumber: Record<string, number> = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  };
  const weekday = dayNameToNumber[weekdayName] ?? 0;
  
  return { year, month, day, weekday };
}

// Calculate next delivery date based on frequency, day of week, and start date
// All dates are calculated in PST/PDT timezone to match delivery schedule
function calculateNextDeliveryDate(
  frequency: 'weekly' | 'bi-weekly' | 'every-4-weeks',
  dayOfWeek: number,
  startDate: Date = new Date()
): Date {
  // Get current date components in PST
  const nowPST = getPSTDateComponents(startDate);
  
  // Get the next occurrence of the selected day of week
  const daysUntilNext = (dayOfWeek - nowPST.weekday + 7) % 7;
  
  let targetDay = nowPST.day;
  let targetMonth = nowPST.month;
  let targetYear = nowPST.year;
  
  // If today is the target day, schedule for next cycle, otherwise schedule for next occurrence
  if (daysUntilNext === 0) {
    // Today is the target day, schedule for the next cycle based on frequency
    switch (frequency) {
      case 'bi-weekly':
        targetDay += 14;
        break;
      case 'every-4-weeks':
        targetDay += 28;
        break;
      case 'weekly':
      default:
        targetDay += 7;
        break;
    }
  } else {
    // Schedule for the next occurrence of the day
    targetDay += daysUntilNext;
  }
  
  // Normalize the date (handle month/year overflow)
  const targetDate = new Date(targetYear, targetMonth, targetDay);
  targetYear = targetDate.getFullYear();
  targetMonth = targetDate.getMonth();
  targetDay = targetDate.getDate();
  
  // Create a date at noon UTC on the target date to test timezone offset
  const testDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 12, 0, 0));
  
  // Get what time noon UTC is in PST
  const pstTimeString = testDate.toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  const pstHour = parseInt(pstTimeString.split(':')[0], 10);
  
  // Calculate offset: if noon UTC is 4 AM PST, offset is 8 hours (PST = UTC-8)
  // If noon UTC is 5 AM PDT, offset is 7 hours (PDT = UTC-7)
  const offsetHours = 12 - pstHour;
  
  // Create UTC date that represents midnight PST/PDT
  const midnightPST = new Date(Date.UTC(targetYear, targetMonth, targetDay, offsetHours, 0, 0));
  
  return midnightPST;
}

export default function SubscriptionScheduleEditModal({
  isOpen,
  onClose,
  subscription,
  onScheduleUpdated
}: SubscriptionScheduleEditModalProps) {
  const [frequency, setFrequency] = useState<'weekly' | 'bi-weekly' | 'every-4-weeks'>(
    subscription.frequency || 'weekly'
  );
  const [dayOfWeekName, setDayOfWeekName] = useState<string>(
    BUSINESS_SETTINGS.deliveryDays.find(day => getDayNumber(day) === subscription.dayOfWeek) || 
    BUSINESS_SETTINGS.deliveryDays[0]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscription.id) {
      setError('Subscription ID not found');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const dayOfWeek = getDayNumber(dayOfWeekName);
      if (dayOfWeek === -1) {
        setError('Invalid delivery day selected');
        return;
      }
      
      // Calculate next delivery date
      const nextDeliveryDate = calculateNextDeliveryDate(frequency, dayOfWeek);
      
      await updateSubscriptionSchedule(subscription.id, {
        frequency,
        dayOfWeek,
        nextDeliveryDate,
      });
      
      onScheduleUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating subscription schedule:', error);
      setError('Failed to update schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate preview of next delivery date
  const previewNextDate = calculateNextDeliveryDate(frequency, getDayNumber(dayOfWeekName));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Subscription Schedule"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'weekly' | 'bi-weekly' | 'every-4-weeks')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
            required
          >
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly (Delivering every 2 weeks)</option>
            <option value="every-4-weeks">Delivering every 4 weeks</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Day
          </label>
          <select
            value={dayOfWeekName}
            onChange={(e) => setDayOfWeekName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
            required
          >
            {BUSINESS_SETTINGS.deliveryDays.map((day) => (
              <option key={day} value={day}>
                {day}s
              </option>
            ))}
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Next Delivery:</strong>{' '}
            {previewNextDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-primary"
          >
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

