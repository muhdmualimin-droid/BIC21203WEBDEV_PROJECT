<?php
require __DIR__.'/../includes/init.php';
if ($method!=='GET') fail('Read only.',405);
if (isset($_GET['line_id'])) {
    $id=number_value($_GET['line_id'],'route identifier');
    $line=query('SELECT * FROM rail_lines WHERE line_id=?',[$id])->fetch();
    if (!$line) fail('Route not found.',404);
    respond(['line'=>$line,'stations'=>query('SELECT DISTINCT s.* FROM stations s LEFT JOIN timetable tt ON tt.station_id=s.station_id LEFT JOIN trains t ON t.train_id=tt.train_id WHERE s.line_id=? OR t.line_id=? ORDER BY s.name',[$id,$id])->fetchAll(),'trains'=>query('SELECT * FROM trains WHERE line_id=? ORDER BY train_number',[$id])->fetchAll(),'timetable'=>query('SELECT tt.*,t.train_number,s.name AS station_name FROM timetable tt JOIN trains t ON t.train_id=tt.train_id JOIN stations s ON s.station_id=tt.station_id WHERE t.line_id=? ORDER BY t.train_number,tt.stop_seq',[$id])->fetchAll()]);
}
respond(query('SELECT * FROM rail_lines ORDER BY line_id')->fetchAll());
