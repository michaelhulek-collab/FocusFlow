// Type definitions for window globals provided by Google scripts
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initializeGoogleApi = (apiKey: string, clientId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (gapiInited && gisInited) {
      resolve();
      return;
    }

    const checkGapi = () => {
      if (window.gapi) {
        window.gapi.load('client', async () => {
          await window.gapi.client.init({
            apiKey: apiKey,
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiInited = true;
          checkAllInited();
        });
      } else {
        setTimeout(checkGapi, 100);
      }
    };

    const checkGis = () => {
      if (window.google) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: '', // defined later
        });
        gisInited = true;
        checkAllInited();
      } else {
        setTimeout(checkGis, 100);
      }
    };

    const checkAllInited = () => {
      if (gapiInited && gisInited) {
        resolve();
      }
    };

    checkGapi();
    checkGis();
  });
};

export const handleAuthClick = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
      }
      resolve();
    };

    if (window.gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

export interface CalendarEvent {
  summary: string;
  start: { date?: string; dateTime?: string };
  htmlLink: string;
}

export const listUpcomingEvents = async (timeMin: string, timeMax: string): Promise<CalendarEvent[]> => {
  try {
    const request = {
      'calendarId': 'primary',
      'timeMin': timeMin, // ISO Date string
      'timeMax': timeMax, // ISO Date string
      'showDeleted': false,
      'singleEvents': true,
      'orderBy': 'startTime',
    };
    const response = await window.gapi.client.calendar.events.list(request);
    return response.result.items;
  } catch (err) {
    console.error('Error fetching events', err);
    throw err;
  }
};
