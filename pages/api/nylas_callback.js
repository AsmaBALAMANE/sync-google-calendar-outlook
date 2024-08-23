import { createClient } from '@supabase/supabase-js'
import { mapEventData } from '../../utils/mapEventData';

const supabaseUrl = "https://vgrlrrpnctpxjzzqlwqr.supabase.co"; //process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncmxycnBuY3RweGp6enFsd3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ0MjU0NDEsImV4cCI6MjA0MDAwMTQ0MX0.Z3xU1gcYY41mnSCDIfoeoqBzi7KhVR0g0Tq0Jk5J0iw";//process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function handler(req, res) {
  console.log('req.query.code', req.query.code)
  const client_id =  "57e8ebc1-3c6a-4b20-bf4a-0420ac583d37";//process.env.NYLAS_CLIENT_ID_V3;
  const redirect_uri = `https://repo-989a.vercel.app/api/nylas_callback`;//`${process.env.NEXT_PUBLIC_VERCEL_URI}/api/nylas_callback`;
  const client_secret ="nyk_v0_z9MWd2rvuEhEJl7MhNgRF4wKt8CIQ0mkTQSrGRYyQE90IZr2fNzSSYtz8H5QE2m1";// process.env.NYLAS_CLIENT_SECRET_V3;
  const bearerToken = process.env.NYLAS_API_KEY;
  const code = req.query.code;

  // Add global variables to temporarily store email, grantId and bearer token
  let email = '';
  let grantId = '';
  let calendar;

  // Utility for creating Nylas header for API calls
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  headers.append("Authorization", `Bearer ${bearerToken}`);
  
  const raw = JSON.stringify({
    "code": req.query.code,
    "client_id": client_id,
    "client_secret": client_secret,
    "redirect_uri": redirect_uri,
    "grant_type": "authorization_code"
  });
  
  const requestOptions = {
    method: "POST",
    headers: headers,
    body: raw,
    redirect: "follow"
  };

  fetch("https://api.eu.nylas.com/v3/connect/token", requestOptions)
  .then(response => response.text())
  .then(response => {
    const userData = JSON.parse(response);
    // console.log('userData', {userData});
    email = userData.email_address;
    // accessToken = userData.access_token;
    console.log('userData.grant_id', userData.grant_id)
    grantId = userData.grant_id;

    return fetch(`https://api.eu.nylas.com/v3/grants/${grantId}/calendars/primary`, {
      method: 'GET',
      headers,
      redirect: 'follow'
    });
  })
  .then(response => response.json())
  .then(response => {
    console.log({ response })
    const calendar = response.data
    
    console.log({ calendar });

    // Retrieve calendar events starting now and starting before 7 days
    const now = Math.floor(Date.now()/1000);
    // 604800 is 7 days in seconds
    const future = now + 604800;

    return fetch(`https://api.eu.nylas.com/v3/grants/${grantId}/events?limit=50&calendar_id=primary&start=${now}&end=${future}`, {
      method: 'GET',
      headers,
      redirect: 'follow'
    })
  })
  .then(response => response.json())
  .then(events => {
    console.log({events})
    const eventsToStore = events.data.map(mapEventData);
    console.log('event', eventsToStore);

    return supabase
      .from('calendar_events')
      .insert(eventsToStore)
  })
  .then(({ data }) => {
    res.status(200).redirect(process.env.NEXT_PUBLIC_VERCEL_URI)
  })
  .catch(error => console.log('something went wrong', error));
}