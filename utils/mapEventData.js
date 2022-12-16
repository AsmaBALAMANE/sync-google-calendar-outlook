const mapEventData = (event) => ({
 event_id: event.id,
 event_title: 'event',
 event_start: event.when.start_time,
 event_end: event.when.end_time,
});

export { mapEventData };