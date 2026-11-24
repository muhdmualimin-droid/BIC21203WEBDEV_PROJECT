<?php
require __DIR__.'/../includes/init.php';
protect(true);
if ($method!=='POST') fail('Use POST.',405);
$d=input();
if (($d['action'] ?? '')!=='import') fail('Unknown action.',400);
$rows=json_decode(file_get_contents(__DIR__.'/../data/demo_feed.json'),true,32,JSON_THROW_ON_ERROR);
db()->beginTransaction(); $saved=0; $skipped=0;
foreach ($rows as $row) {
    $row['train_id']=query('SELECT train_id FROM trains WHERE train_number=?',[$row['train_number']])->fetchColumn();
    $row['station_id']=query('SELECT station_id FROM stations WHERE code=?',[$row['station_code']])->fetchColumn();
    if (save_update($row,true)) $saved++; else $skipped++;
}
db()->commit(); respond(['imported'=>$saved,'protected'=>$skipped],"Imported $saved demo reports; preserved $skipped existing non-demo reports. No background demo mode is running.");
