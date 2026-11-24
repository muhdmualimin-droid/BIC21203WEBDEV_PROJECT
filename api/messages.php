<?php
require __DIR__.'/../includes/init.php';
protect();
if ($method==='GET') respond(query('SELECT message_id,name,email,subject,body,is_read,created_at FROM messages ORDER BY created_at DESC,message_id DESC')->fetchAll());
$d=input(); $action=choice($d['action'] ?? '',['mark_read','mark_unread','mark_all_read','delete'],'action');
if ($action==='delete') protect(true);
db()->beginTransaction();
if ($action==='mark_all_read') query('UPDATE messages SET is_read=1 WHERE is_read=0');
else {
    $id=reference($d['id'] ?? null,'messages','message_id');
    if ($action==='delete') query('DELETE FROM messages WHERE message_id=?',[$id]);
    else query('UPDATE messages SET is_read=? WHERE message_id=?',[$action==='mark_read'?1:0,$id]);
}
audit($action,'messages','id='.($id ?? 'all')); db()->commit(); respond(null,'Messages updated.');
