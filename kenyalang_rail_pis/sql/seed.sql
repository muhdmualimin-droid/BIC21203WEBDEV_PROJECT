-- ============================================================================
--  Kenyalang Rail PIS  ::  demo data
--  Loaded by install.php after schema.sql
--
-- ============================================================================

SET NAMES utf8mb4;


-- ----------------------------------------------------------------------------
-- users (bcrypt hashes produced with PHP password_hash)
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- rail_lines
-- ----------------------------------------------------------------------------
INSERT INTO `rail_lines` (`line_id`, `code`, `name`, `operator`, `description`, `colour_hex`) VALUES
(1, 'KJ',  'Seremban Line',         'KTMB Komuter', 'North-south Komuter corridor linking Kuala Lumpur with Mid Valley and Seremban.', '#0B5CD5'),
(2, 'PK',  'Port Klang Line',       'KTMB Komuter', 'Western Komuter corridor serving Subang Jaya, Shah Alam and Port Klang.', '#C62828'),
(3, 'ETS', 'Electric Train Service','KTMB ETS',     'Intercity electric services from KL Sentral to Ipoh, Butterworth and Padang Besar.', '#8A6A00'),
(4, 'SK',  'Skypark Link',          'KTMB',         'Dedicated airport rail link between KL Sentral and Terminal Skypark.', '#6A2C91'),
(5, 'SH',  'Shuttle Tebrau',        'KTMB Shuttle', 'Cross-border shuttle connecting JB Sentral with Woodlands, Singapore.', '#00796B');

-- ----------------------------------------------------------------------------
-- stations
-- ----------------------------------------------------------------------------
INSERT INTO `stations` (`station_id`, `code`, `name`, `zone`, `line_id`, `latitude`, `longitude`, `facilities`) VALUES
( 1, 'SENT', 'KL Sentral',         '1', 1, 3.133300, 101.686900, 'Lifts, toilets, retail, baggage storage, taxi bay'),
( 2, 'KUL',  'Kuala Lumpur',       '1', 1, 3.133000, 101.693000, 'Lifts, toilets, retail, taxi bay'),
( 3, 'BNK',  'Bank Negara',        '1', 1, 3.154400, 101.692500, 'Lifts, toilets, taxi bay'),
( 4, 'PTR',  'Putra',              '1', 1, 3.167800, 101.690000, 'Lifts, ticket vending machines, surau'),
( 5, 'MVY',  'Mid Valley',         '2', 1, 3.117500, 101.678500, 'Lifts, link bridge to mall'),
( 6, 'SRB',  'Seremban',           '3', 1, 2.724500, 101.941000, 'Lifts, toilets, parking, taxi bay'),
( 7, 'SUB',  'Subang Jaya',        '2', 2, 3.084600, 101.586500, 'Lifts, parking, taxi bay'),
( 8, 'SHA',  'Shah Alam',          '2', 2, 3.073300, 101.521000, 'Lifts, parking, toilets'),
( 9, 'PKL',  'Port Klang',         '3', 2, 3.000000, 101.393000, 'Lifts, ferry link, parking'),
(10, 'IPH',  'Ipoh',               '4', 3, 4.597500, 101.090000, 'Lifts, toilets, parking, taxi bay'),
(11, 'BTW',  'Butterworth',        '5', 3, 5.395000, 100.370000, 'Lifts, toilets, ferry link, parking'),
(12, 'PBS',  'Padang Besar',       '5', 3, 6.660000, 100.320000, 'Lifts, toilets, immigration, parking'),
(13, 'SKY',  'Terminal Skypark',   '2', 4, 3.058000, 101.552000, 'Lifts, airport check-in kiosks, toilets'),
(14, 'JBS',  'JB Sentral',         '6', 5, 1.463000, 103.764000, 'Lifts, immigration, toilets, taxi bay'),
(15, 'WDL',  'Woodlands',          '6', 5, 1.436000, 103.786000, 'Lifts, immigration, toilets');

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
INSERT INTO `trains` (`train_id`, `train_number`, `train_type`, `direction`, `capacity`, `line_id`, `status`) VALUES
( 1, 'EMU40', 'Komuter', 'northbound', 400, 1, 'active'),
( 2, 'EMU29', 'Komuter', 'southbound', 400, 1, 'active'),
( 3, 'EMU22', 'Komuter', 'northbound', 400, 1, 'active'),
( 4, 'SCS12', 'Komuter', 'southbound', 400, 1, 'active'),
( 5, 'SCS11', 'Komuter', 'northbound', 400, 1, 'active'),
( 6, 'SCS22', 'Komuter', 'southbound', 400, 1, 'active'),
( 7, 'SCS25', 'Komuter', 'northbound', 400, 1, 'active'),
( 8, 'EMU24', 'Komuter', 'southbound', 400, 2, 'active'),
( 9, 'EMU33', 'Komuter', 'northbound', 400, 2, 'active'),
(10, 'SCS10', 'Komuter', 'southbound', 400, 2, 'active'),
(11, 'SCS17', 'Komuter', 'northbound', 400, 2, 'active'),
(12, 'SCS23', 'Komuter', 'southbound', 400, 2, 'active'),
(13, 'SCS26', 'Komuter', 'northbound', 400, 2, 'active'),
(14, 'SCS27', 'Komuter', 'southbound', 400, 2, 'active'),
(15, 'ETS206', 'Intercity', 'northbound', 320, 3, 'active'),
(16, 'ETS214', 'Intercity', 'southbound', 320, 3, 'active'),
(17, 'ETS304', 'Intercity', 'northbound', 320, 3, 'active'),
(18, 'SCS04', 'ETS', 'southbound', 320, 3, 'active'),
(19, 'SCS29', 'ETS', 'northbound', 320, 3, 'active'),
(20, 'SCS38', 'ETS', 'southbound', 320, 3, 'active'),
(21, 'SK01', 'Shuttle', 'northbound', 400, 4, 'active'),
(22, 'ST01', 'Shuttle', 'northbound', 250, 5, 'active'),
(23, 'DMU12', 'Intercity', 'southbound', 320, 5, 'active'),
(24, 'DMU13', 'Intercity', 'northbound', 320, 5, 'active');

-- ----------------------------------------------------------------------------
-- announcements
-- ----------------------------------------------------------------------------
INSERT INTO `announcements` (`title`, `body`, `type`, `station_id`, `published_by`, `expires_at`, `created_at`) VALUES
('Weekend track maintenance: Kuala Lumpur to Mid Valley',
 'Engineering works between Kuala Lumpur and Mid Valley run from 22:00 to 05:00 on Saturday and Sunday. Services use a single platform and may be delayed by up to 10 minutes. Please allow extra time for your journey and follow staff instructions.',
 'delay', 2, 1, NOW() + INTERVAL 3 DAY, NOW() - INTERVAL 1 DAY),

('New ETS timetable takes effect on 1 December',
 'The revised Electric Train Service timetable adds two additional KL Sentral to Ipoh services each weekday. Passengers holding tickets for travel after 1 December will be re-seated on the closest available departure at no extra cost.',
 'info', 1, 1, NULL, NOW() - INTERVAL 2 DAY),

('Port Klang Line: normal service resumed',
 'The earlier signalling fault near Shah Alam has been repaired and trains are running to the published timetable. We apologise for the inconvenience caused to passengers this morning.',
 'info', 8, 1, NOW() + INTERVAL 2 DAY, NOW() - INTERVAL 4 HOUR),

('Skypark Link promotional fare until 31 December',
 'Travel between KL Sentral and Terminal Skypark for a flat promotional fare when you tap in with a Touch n Go card. The promotion applies to all trips before 31 December and cannot be combined with other discounts.',
 'info', 13, 2, NOW() + INTERVAL 30 DAY, NOW() - INTERVAL 3 DAY),

('Escalator replacement at KL Sentral, concourse level',
 'The escalator serving platforms 5 and 6 is out of service while the motor is replaced. Lifts remain available and are prioritised for passengers with reduced mobility, luggage or prams. Please follow the temporary wayfinding signs.',
 'alert', 1, 2, NOW() + INTERVAL 10 DAY, NOW() - INTERVAL 6 HOUR),

('Safety reminder: stand behind the yellow line',
 'Trains approach the platform faster than they appear. Always stand behind the yellow safety line, hold children by the hand and never attempt to board a train after the doors begin to close.',
 'info', NULL, 1, NULL, NOW() - INTERVAL 12 DAY),

('Shuttle Tebrau: additional evening service',
 'An extra 20:45 departure from JB Sentral to Woodlands now operates daily. Cross-border passengers must present a valid passport and complete immigration clearance before boarding.',
 'info', 14, 1, NULL, NOW() - INTERVAL 5 DAY),

('Peak-hour frequency increased on the Port Klang Line',
 'Four-car trainsets now operate the morning and evening peak services between KL Sentral and Port Klang, increasing capacity on the busiest departures by roughly 30 percent.',
 'info', 7, 1, NULL, NOW() - INTERVAL 9 DAY),

('Signal fault at Bank Negara (resolved)',
 'A signal fault at Bank Negara caused delays of up to 25 minutes on the Seremban Line earlier today. The fault was cleared at 09:40 and normal service has resumed. This notice is kept for the record and has expired.',
 'alert', 3, 1, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 2 DAY);

-- Additional current notices give the public Alerts page useful sample content.
INSERT INTO `announcements` (`title`, `body`, `type`, `station_id`, `published_by`, `expires_at`, `created_at`) VALUES
('Platform change for evening Seremban services',
 'Selected southbound services will depart from Platform 4 this evening. Please check the departure board before entering the paid area.',
 'info', 1, 2, NOW() + INTERVAL 1 DAY, NOW() - INTERVAL 30 MINUTE),
('Minor delay near Subang Jaya',
 'Port Klang Line services are operating with a delay of up to 8 minutes while a signal inspection is completed near Subang Jaya.',
 'delay', 7, 1, NOW() + INTERVAL 4 HOUR, NOW() - INTERVAL 25 MINUTE),
('Lift inspection at Butterworth',
 'The lift serving the northern end of Platform 2 is temporarily unavailable for inspection. Please use the staffed accessible route.',
 'alert', 11, 2, NOW() + INTERVAL 8 HOUR, NOW() - INTERVAL 45 MINUTE),
('ETS boarding reminder',
 'Please arrive at the platform at least ten minutes before your scheduled ETS departure. Keep your ticket ready for inspection.',
 'info', 1, 1, NOW() + INTERVAL 7 DAY, NOW() - INTERVAL 2 HOUR),
('Skypark Link shuttle bus connection',
 'The airport shuttle connection will wait up to five minutes for the next arriving Skypark Link service during off-peak hours.',
 'info', 13, 2, NOW() + INTERVAL 2 DAY, NOW() - INTERVAL 3 HOUR),
('Woodlands immigration queue notice',
 'Cross-border passengers should allow additional time for immigration clearance at Woodlands during the evening peak.',
 'alert', 15, 1, NOW() + INTERVAL 1 DAY, NOW() - INTERVAL 1 HOUR),
('Station cleanliness campaign',
 'Help keep platforms clear by placing food containers and bottles in the marked recycling bins.',
 'info', NULL, 2, NOW() + INTERVAL 14 DAY, NOW() - INTERVAL 5 HOUR),
('Accessible boarding assistance',
 'Passengers who require ramp assistance may approach the customer service desk or use the station help point before boarding.',
 'info', NULL, 1, NOW() + INTERVAL 21 DAY, NOW() - INTERVAL 7 HOUR);

-- ----------------------------------------------------------------------------
-- messages: realistic contact-form examples for Dashboard message management
-- ----------------------------------------------------------------------------
INSERT INTO `messages` (`name`, `email`, `subject`, `body`, `ip`, `is_read`, `created_at`) VALUES
('Aina Rahman', 'aina.rahman@example.test', 'Departure board feedback', 'The station filter was easy to use. Please keep the delay label visible on mobile.', '127.0.0.1', 0, NOW() - INTERVAL 12 MINUTE),
('Daniel Lim', 'daniel.lim@example.test', 'Accessibility question', 'Does KL Sentral have lift access to the ETS platforms? I would like to plan my journey before travelling.', '127.0.0.1', 0, NOW() - INTERVAL 35 MINUTE),
('Siti Nur', 'siti.nur@example.test', 'Announcement audio', 'The read aloud button is useful. It would help to show which station the alert applies to.', '127.0.0.1', 1, NOW() - INTERVAL 1 HOUR),
('Farid Iskandar', 'farid.iskandar@example.test', 'Timetable display', 'Could the route page show both arrival and departure time for each stop?', '127.0.0.1', 1, NOW() - INTERVAL 2 HOUR),
('Mei Ling', 'mei.ling@example.test', 'Platform change', 'Thank you for clearly showing the platform change notice on the homepage.', '127.0.0.1', 0, NOW() - INTERVAL 3 HOUR),
('Harith Zaki', 'harith.zaki@example.test', 'Mobile view', 'The departure board fits my phone well and the table can be scrolled.', '127.0.0.1', 1, NOW() - INTERVAL 4 HOUR),
('Nur Huda', 'nur.huda@example.test', 'Lost item enquiry', 'I left a blue umbrella on a train from Mid Valley. Please advise which station desk to contact.', '127.0.0.1', 0, NOW() - INTERVAL 5 HOUR),
('Kumar Raj', 'kumar.raj@example.test', 'Service information', 'The current journey status and train condition labels are easy to understand.', '127.0.0.1', 1, NOW() - INTERVAL 6 HOUR),
('Hafiz Omar', 'hafiz.omar@example.test', 'Station facilities', 'Please add information about parking at Seremban station to the route details.', '127.0.0.1', 1, NOW() - INTERVAL 1 DAY),
('Sofia Tan', 'sofia.tan@example.test', 'General feedback', 'The colours and text labels make the announcement cards clear.', '127.0.0.1', 1, NOW() - INTERVAL 1 DAY - INTERVAL 2 HOUR),
('Amirul Hakim', 'amirul.hakim@example.test', 'Delay information', 'Please continue showing the number of delayed minutes next to the status.', '127.0.0.1', 0, NOW() - INTERVAL 2 DAY),
('Grace Wong', 'grace.wong@example.test', 'Project demonstration', 'The local demo data makes it easier to understand the train update workflow.', '127.0.0.1', 1, NOW() - INTERVAL 3 DAY);

-- ----------------------------------------------------------------------------
-- settings
-- ----------------------------------------------------------------------------
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('feed_mode',      'manual'),
('last_ingest_at', '0'),
('last_source',    'none');

-- ----------------------------------------------------------------------------
-- timetable (one scheduled trip per train)
-- ----------------------------------------------------------------------------
INSERT INTO `timetable` (`train_id`, `station_id`, `stop_seq`, `arrival`, `departure`) VALUES
(1, 6, 1, NULL, '06:17:00'),
(1, 5, 2, '06:57:00', '06:57:00'),
(1, 1, 3, '07:09:00', '07:09:00'),
(1, 2, 4, '07:17:00', '07:17:00'),
(1, 3, 5, '07:25:00', '07:25:00'),
(1, 4, 6, '07:32:00', NULL),
(2, 4, 1, NULL, '07:04:00'),
(2, 3, 2, '07:12:00', '07:12:00'),
(2, 2, 3, '07:19:00', '07:19:00'),
(2, 1, 4, '07:27:00', '07:27:00'),
(2, 5, 5, '07:39:00', '07:39:00'),
(2, 6, 6, '08:19:00', NULL),
(3, 6, 1, NULL, '07:51:00'),
(3, 5, 2, '08:31:00', '08:31:00'),
(3, 1, 3, '08:43:00', '08:43:00'),
(3, 2, 4, '08:51:00', '08:51:00'),
(3, 3, 5, '08:59:00', '08:59:00'),
(3, 4, 6, '09:06:00', NULL),
(4, 4, 1, NULL, '08:38:00'),
(4, 3, 2, '08:46:00', '08:46:00'),
(4, 2, 3, '08:53:00', '08:53:00'),
(4, 1, 4, '09:01:00', '09:01:00'),
(4, 5, 5, '09:13:00', '09:13:00'),
(4, 6, 6, '09:53:00', NULL),
(5, 6, 1, NULL, '09:25:00'),
(5, 5, 2, '10:05:00', '10:05:00'),
(5, 1, 3, '10:17:00', '10:17:00'),
(5, 2, 4, '10:25:00', '10:25:00'),
(5, 3, 5, '10:33:00', '10:33:00'),
(5, 4, 6, '10:40:00', NULL),
(6, 4, 1, NULL, '10:12:00'),
(6, 3, 2, '10:20:00', '10:20:00'),
(6, 2, 3, '10:27:00', '10:27:00'),
(6, 1, 4, '10:35:00', '10:35:00'),
(6, 5, 5, '10:47:00', '10:47:00'),
(6, 6, 6, '11:27:00', NULL),
(7, 6, 1, NULL, '10:59:00'),
(7, 5, 2, '11:39:00', '11:39:00'),
(7, 1, 3, '11:51:00', '11:51:00'),
(7, 2, 4, '11:59:00', '11:59:00'),
(7, 3, 5, '12:07:00', '12:07:00'),
(7, 4, 6, '12:14:00', NULL),
(8, 1, 1, NULL, '11:46:00'),
(8, 7, 2, '12:03:00', '12:03:00'),
(8, 8, 3, '12:11:00', '12:11:00'),
(8, 9, 4, '12:36:00', NULL),
(9, 9, 1, NULL, '12:33:00'),
(9, 8, 2, '12:58:00', '12:58:00'),
(9, 7, 3, '13:06:00', '13:06:00'),
(9, 1, 4, '13:23:00', NULL),
(10, 1, 1, NULL, '13:20:00'),
(10, 7, 2, '13:37:00', '13:37:00'),
(10, 8, 3, '13:45:00', '13:45:00'),
(10, 9, 4, '14:10:00', NULL),
(11, 9, 1, NULL, '14:07:00'),
(11, 8, 2, '14:32:00', '14:32:00'),
(11, 7, 3, '14:40:00', '14:40:00'),
(11, 1, 4, '14:57:00', NULL),
(12, 1, 1, NULL, '14:54:00'),
(12, 7, 2, '15:11:00', '15:11:00'),
(12, 8, 3, '15:19:00', '15:19:00'),
(12, 9, 4, '15:44:00', NULL),
(13, 9, 1, NULL, '15:41:00'),
(13, 8, 2, '16:06:00', '16:06:00'),
(13, 7, 3, '16:14:00', '16:14:00'),
(13, 1, 4, '16:31:00', NULL),
(14, 1, 1, NULL, '16:28:00'),
(14, 7, 2, '16:45:00', '16:45:00'),
(14, 8, 3, '16:53:00', '16:53:00'),
(14, 9, 4, '17:18:00', NULL),
(15, 1, 1, NULL, '17:15:00'),
(15, 10, 2, '19:45:00', '19:45:00'),
(15, 11, 3, '22:15:00', '22:15:00'),
(15, 12, 4, '00:15:00', NULL),
(16, 12, 1, NULL, '18:02:00'),
(16, 11, 2, '20:02:00', '20:02:00'),
(16, 10, 3, '22:32:00', '22:32:00'),
(16, 1, 4, '01:02:00', NULL),
(17, 1, 1, NULL, '18:49:00'),
(17, 10, 2, '21:19:00', '21:19:00'),
(17, 11, 3, '23:49:00', '23:49:00'),
(17, 12, 4, '01:49:00', NULL),
(18, 12, 1, NULL, '19:36:00'),
(18, 11, 2, '21:36:00', '21:36:00'),
(18, 10, 3, '00:06:00', '00:06:00'),
(18, 1, 4, '02:36:00', NULL),
(19, 1, 1, NULL, '20:23:00'),
(19, 10, 2, '22:53:00', '22:53:00'),
(19, 11, 3, '01:23:00', '01:23:00'),
(19, 12, 4, '03:23:00', NULL),
(20, 12, 1, NULL, '05:40:00'),
(20, 11, 2, '07:40:00', '07:40:00'),
(20, 10, 3, '10:10:00', '10:10:00'),
(20, 1, 4, '12:40:00', NULL),
(21, 1, 1, NULL, '06:27:00'),
(21, 13, 2, '06:52:00', NULL),
(22, 14, 1, NULL, '07:14:00'),
(22, 15, 2, '07:19:00', NULL),
(23, 15, 1, NULL, '08:01:00'),
(23, 14, 2, '08:06:00', NULL),
(24, 14, 1, NULL, '08:48:00'),
(24, 15, 2, '08:53:00', NULL);

-- ----------------------------------------------------------------------------
-- local demo journey reports: staff can replace any of these from Train Updates
-- ----------------------------------------------------------------------------
INSERT INTO `live_updates`
(`train_id`, `station_id`, `status`, `delay_min`, `eta`, `source_api`, `is_simulated`, `fetched_at`) VALUES
( 1, 1, 'arriving',  0, NOW() + INTERVAL  2 MINUTE, 'local_demo', 1, NOW()),
( 2, 2, 'on_time',   0, NOW() + INTERVAL  5 MINUTE, 'local_demo', 1, NOW()),
( 3, 3, 'delayed',   7, NOW() + INTERVAL 12 MINUTE, 'local_demo', 1, NOW()),
( 4, 5, 'on_time',   0, NOW() + INTERVAL 16 MINUTE, 'local_demo', 1, NOW()),
( 5, 1, 'arriving',  0, NOW() + INTERVAL 18 MINUTE, 'local_demo', 1, NOW()),
( 6, 4, 'cancelled', 0, NULL,                       'local_demo', 1, NOW()),
( 7, 2, 'on_time',   0, NOW() + INTERVAL 25 MINUTE, 'local_demo', 1, NOW()),
( 8, 7, 'delayed',   4, NOW() + INTERVAL 28 MINUTE, 'local_demo', 1, NOW()),
( 9, 8, 'on_time',   0, NOW() + INTERVAL 31 MINUTE, 'local_demo', 1, NOW()),
(10, 1, 'arriving',  0, NOW() + INTERVAL 35 MINUTE, 'local_demo', 1, NOW()),
(11, 9, 'on_time',   0, NOW() + INTERVAL 39 MINUTE, 'local_demo', 1, NOW()),
(12, 7, 'delayed',  10, NOW() + INTERVAL 46 MINUTE, 'local_demo', 1, NOW()),
(13, 8, 'on_time',   0, NOW() + INTERVAL 51 MINUTE, 'local_demo', 1, NOW()),
(14, 9, 'on_time',   0, NOW() + INTERVAL 55 MINUTE, 'local_demo', 1, NOW()),
(15,10, 'delayed',  15, NOW() + INTERVAL 65 MINUTE, 'local_demo', 1, NOW()),
(16,11, 'on_time',   0, NOW() + INTERVAL 72 MINUTE, 'local_demo', 1, NOW()),
(17,10, 'arriving',  0, NOW() + INTERVAL 78 MINUTE, 'local_demo', 1, NOW()),
(18,12, 'on_time',   0, NOW() + INTERVAL 85 MINUTE, 'local_demo', 1, NOW()),
(19,11, 'delayed',   6, NOW() + INTERVAL 92 MINUTE, 'local_demo', 1, NOW()),
(20,10, 'on_time',   0, NOW() + INTERVAL 99 MINUTE, 'local_demo', 1, NOW()),
(21,13, 'on_time',   0, NOW() + INTERVAL 18 MINUTE, 'local_demo', 1, NOW()),
(22,15, 'arriving',  0, NOW() + INTERVAL 24 MINUTE, 'local_demo', 1, NOW()),
(23,14, 'delayed',   5, NOW() + INTERVAL 33 MINUTE, 'local_demo', 1, NOW()),
(24,15, 'on_time',   0, NOW() + INTERVAL 42 MINUTE, 'local_demo', 1, NOW());

-- ----------------------------------------------------------------------------
-- audit_log: starter examples for the dashboard audit trail
-- ----------------------------------------------------------------------------
INSERT INTO `audit_log` (`user_id`, `action`, `entity`, `details`, `ip_address`, `created_at`) VALUES
(1, 'create', 'announcements', 'Seeded weekend maintenance notice', '127.0.0.1', NOW() - INTERVAL 1 DAY),
(2, 'update', 'live_updates', 'Seeded Seremban Line sample report', '127.0.0.1', NOW() - INTERVAL 6 HOUR),
(1, 'update', 'live_updates', 'Seeded ETS sample report', '127.0.0.1', NOW() - INTERVAL 3 HOUR),
(2, 'create', 'announcements', 'Seeded accessibility notice', '127.0.0.1', NOW() - INTERVAL 2 HOUR),
(1, 'update', 'messages', 'Reviewed sample contact messages', '127.0.0.1', NOW() - INTERVAL 1 HOUR);
