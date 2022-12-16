import { createClient } from '@supabase/supabase-js'
import { mapEventData } from '../../utils/mapEventData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function handler(req, res) {
  const client_id = process.env.NYLAS_CLIENT_ID;
  const client_secret = process.env.NYLAS_CLIENT_SECRET;
  const code = req.query.code;

  // Add global variables to temporarily store email and access token
  let email = '';
  let accessToken = '';
  let calendar = '';

  // Utility for creating Nylas header for API calls
  const createHeaders = () => {
    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${accessToken}`);
    return headers;
  }

  fetch(`https://api.nylas.com/oauth/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=authorization_code&code=${code}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.text())
  .then(response => {
    const userData = JSON.parse(response);
    email = userData.email_address;
    accessToken = userData.access_token;

    return fetch("https://api.nylas.com/calendars", {
      method: 'GET',
      headers: createHeaders(),
      redirect: 'follow'
    });
  })
  .then(response => response.json())
  .then(calendars => {
    const calendar = calendars.filter(({ name }) => 
    name === email || name === 'Calendar'
    )[0];
    
    console.log('calendar selected', calendar);
    if(!calendar) {
      console.log('main calendar not found')
      res.status(200).redirect(process.env.NEXT_PUBLIC_VERCEL_URI)
    }

    // Retrieve calendar events starting now and starting before 7 days
    const now = Math.floor(Date.now()/1000);
    // 604800 is 7 days in seconds
    const future = now + 604800;

    return fetch(`https://api.nylas.com/events?calendar_id=${calendar.id}&starts_after${now}&starts_before${future}`, {
      method: 'GET',
      headers: createHeaders(),
      redirect: 'follow'
    })
  })
  .then(response => response.json())
  .then(events => {
    const eventsToStore = events.map(mapEventData);
    console.log('events', eventsToStore);

    return supabase
      .from('calendar_events')
      .insert(eventsToStore)
  })
  .then(({ data }) => {
    res.status(200).redirect(process.env.NEXT_PUBLIC_VERCEL_URI)
  })
  .catch(error => console.log('something went wrong', error));
}