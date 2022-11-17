import { useState, useMemo, useEffect, useRef } from 'react';

import { Page, ButtonGroup, Button, Text, Input } from '@geist-ui/core'
import { Calendar, luxonLocalizer, Views } from 'react-big-calendar'
import { DateTime, Settings } from 'luxon'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

  const onConnectAccount = () => {
    const emailToAuthenticate = inputRef.current.value;

    const CLIENT_ID = process.env.NEXT_PUBLIC_NYLAS_CLIENT_ID;
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_VERCEL_URI}/api/nylas_callback`;

    window.location = `https://api.nylas.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&login_hint=${emailToAuthenticate}&response_type=code&scopes=calendar.read_only`

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

  console.log(57, eventData);
  return (
    <Page>
    <Text h1><span style={{ color: '#0070f3' }}>🗓️ CalSync </span>built with Nylas</Text>
    
    <Input clearable initialValue="" placeholder="Enter your email to start!" ref={inputRef}/>
    <ButtonGroup type="success">
      <Button  onClick={onConnectAccount}>Connect Account</Button>
    </ButtonGroup>
    <div>
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
		</div>
  </Page>
  )
}

export default Home;