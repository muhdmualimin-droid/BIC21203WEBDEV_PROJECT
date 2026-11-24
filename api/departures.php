<?php
require __DIR__.'/../includes/init.php';
if ($method!=='GET') fail('Read only.',405);
respond(['rows'=>departures(($_GET['all'] ?? '')==='1'),'stats'=>['lines'=>(int)query('SELECT COUNT(*) FROM rail_lines')->fetchColumn(),'stations'=>(int)query('SELECT COUNT(*) FROM stations')->fetchColumn(),'active_trains'=>(int)query("SELECT COUNT(*) FROM trains WHERE status='active'")->fetchColumn()],'refreshed_at'=>date('c')]);
