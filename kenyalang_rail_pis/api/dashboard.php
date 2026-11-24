<?php
require __DIR__.'/../includes/init.php';
$u=protect();
if ($method!=='GET') fail('Read only.',405);
$stats=[];
foreach (['stations','trains','live_updates','announcements','users'] as $table) $stats[$table]=(int)query("SELECT COUNT(*) FROM $table")->fetchColumn();
$stats['delayed']=(int)query("SELECT COUNT(*) FROM live_updates WHERE status='delayed'")->fetchColumn();
respond(['stats'=>$stats,'recent'=>array_slice(query('SELECT u.*,t.train_number FROM live_updates u JOIN trains t ON t.train_id=u.train_id ORDER BY fetched_at DESC')->fetchAll(),0,10),'audit'=>$u['role']==='admin'?query('SELECT a.*,u.name AS user_name FROM audit_log a LEFT JOIN users u ON u.user_id=a.user_id ORDER BY log_id DESC LIMIT 50')->fetchAll():[]]);
