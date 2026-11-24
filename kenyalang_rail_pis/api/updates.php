<?php
require __DIR__.'/../includes/init.php';
protect();
if ($method==='GET') respond(departures());
$d=input();
db()->beginTransaction(); save_update($d); db()->commit();
respond(null,'Journey status saved. Passenger boards refresh within 15 seconds.');
