/**
 * Daily Report Calendar Export - Google Apps Script
 * 
 * このスクリプトはVSCode Daily Report Extensionのために
 * Googleカレンダーのイベントを取得するWeb Appです。
 */

function doGet(e) {
  try {
    // Enable CORS for cross-origin requests
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    const date = e.parameter.date || getTodayString();
    console.log(`Fetching calendar events for date: ${date}`);
    
    const events = getCalendarEvents(date);
    
    const response = {
      success: true,
      date: date,
      events: events,
      timestamp: new Date().toISOString(),
      eventCount: events.length
    };
    
    output.setContent(JSON.stringify(response));
    return output;
    
  } catch (error) {
    console.error('Error in doGet:', error);
    
    const errorResponse = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(errorResponse));
    return output;
  }
}

function getCalendarEvents(dateString) {
  try {
    const date = new Date(dateString + 'T00:00:00');
    
    // Invalid date check
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD format.`);
    }
    
    // Set time range for the specified date
    const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    console.log(`Fetching events from ${startTime.toISOString()} to ${endTime.toISOString()}`);
    
    // Get events from primary calendar
    const calendar = CalendarApp.getDefaultCalendar();
    const events = calendar.getEvents(startTime, endTime);
    
    console.log(`Found ${events.length} events`);
    
    // Convert events to our format
    const formattedEvents = events.map(event => {
      const attendees = event.getGuestList();
      
      return {
        title: event.getTitle() || 'No Title',
        startTime: event.getStartTime().toISOString(),
        endTime: event.getEndTime().toISOString(),
        location: event.getLocation() || '',
        attendees: attendees.length,
        isAllDay: event.isAllDayEvent(),
        description: event.getDescription() || '',
        // Optional: Include attendee details (be careful with privacy)
        // attendeeList: attendees.map(guest => ({
        //   email: guest.getEmail(),
        //   name: guest.getName() || guest.getEmail(),
        //   status: guest.getGuestStatus().toString()
        // }))
      };
    });
    
    // Sort events by start time
    formattedEvents.sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    
    return formattedEvents;
    
  } catch (error) {
    console.error('Error in getCalendarEvents:', error);
    throw new Error(`Failed to fetch calendar events: ${error.toString()}`);
  }
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Test function - can be used for debugging
function testGetEvents() {
  try {
    const today = getTodayString();
    console.log(`Testing with date: ${today}`);
    
    const events = getCalendarEvents(today);
    console.log(`Test result: ${events.length} events found`);
    console.log(JSON.stringify(events, null, 2));
    
    return events;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Alternative test with specific date
function testGetEventsForDate() {
  try {
    const testDate = '2024-01-15'; // Change this to test specific date
    console.log(`Testing with date: ${testDate}`);
    
    const events = getCalendarEvents(testDate);
    console.log(`Test result: ${events.length} events found`);
    console.log(JSON.stringify(events, null, 2));
    
    return events;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Function to test doGet endpoint locally
function testDoGet() {
  try {
    const mockEvent = {
      parameter: {
        date: getTodayString()
      }
    };
    
    const result = doGet(mockEvent);
    const content = result.getContent();
    console.log('doGet test result:', content);
    
    return JSON.parse(content);
  } catch (error) {
    console.error('doGet test failed:', error);
    throw error;
  }
}