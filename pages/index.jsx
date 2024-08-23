import { useState, useMemo, useEffect, useRef } from 'react';

import { Page, ButtonGroup, Button, Text, Input } from '@geist-ui/core'
import { Calendar, luxonLocalizer, Views } from 'react-big-calendar'
import { DateTime, Settings } from 'luxon'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://vgrlrrpnctpxjzzqlwqr.supabase.co"; //process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncmxycnBuY3RweGp6enFsd3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ0MjU0NDEsImV4cCI6MjA0MDAwMTQ0MX0.Z3xU1gcYY41mnSCDIfoeoqBzi7KhVR0g0Tq0Jk5J0iw";//process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


function getDate(str, DateTimeObj) {
  return DateTimeObj.fromISO(str).toJSDate()
}

// starting date of react-big-calendar
const defaultDateStr = '2022-12-11'

const Home = () => {
  const defaultTZ = DateTime.local().zoneName;
  const inputRef = useRef(null);
  const [eventData, setEventData] = useState([]);
  const [timezone, setTimezone] = useState(defaultTZ);

  useEffect(async function() {
    const { data } = await supabase.from('calendar_events').select('*')
    setEventData(data);
  }, [])

  console.log(eventData)
  
  const onConnectAccount = () => {
    const emailToAuthenticate = inputRef.current.value;
    const responseType = 'code';
    const scopes = 'calendar.read_only';

    const CLIENT_ID = "57e8ebc1-3c6a-4b20-bf4a-0420ac583d37";//process.env.NEXT_PUBLIC_NYLAS_CLIENT_ID_V3;
    const REDIRECT_URI =`http://localhost:3000/api/nylas_callback`; //`https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}/api/nylas_callback`;
    
    // Note: removed &provider={{provider}}
    window.location = `https://api.eu.nylas.com/v3/connect/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${responseType}&login_hint=${emailToAuthenticate}&scopes=${scopes}`
  };

  const { defaultDate, getNow, localizer, scrollToTime } = useMemo(() => {
    Settings.defaultZone = timezone;
    return {
      defaultDate: getDate(defaultDateStr, DateTime),
      getNow: () => DateTime.local().toJSDate(),
      localizer: luxonLocalizer(DateTime),
      myEvents: [
        ...eventData.map(e => ({
          id: e.event_id,
          title: e.event_title,
          start: new Date(e.event_start * 1000),
          end: new Date(e.event_end * 1000),
        }))
      ],
      scrollToTime: DateTime.local().toJSDate(),
    }
  }, [timezone]);

  return (
    <Page>
    <Text h1><span style={{ color: '#0070f3' }}>🗓️ CalSync </span>built with Nylas</Text>
    
    <Input clearable initialValue="" placeholder="Enter your email to start!" ref={inputRef}/>
    <ButtonGroup type="success">
      <Button  onClick={onConnectAccount}>Connect Account</Button>
    </ButtonGroup>

    {/* <div>
			{ eventData.length !== 0 && (
        <Calendar
          defaultDate={defaultDate}
          defaultView={Views.WEEK}
          events={[
            ...eventData.map(e => ({
              id: e.event_id,
              title: e.event_title,
              start: new Date(e.event_start * 1000),
              end: new Date(e.event_end * 1000),
            }))
          ]}
          getNow={getNow}
          localizer={localizer}
          scrollToTime={scrollToTime}
        />
      )}
		</div> */}
  </Page>
  )
}

export default Home;