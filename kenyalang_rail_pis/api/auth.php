<?php
require __DIR__.'/../includes/init.php';
if ($method==='GET') respond(['user'=>user(),'csrf'=>$_SESSION['csrf']]);
$d=input();
if (($d['action'] ?? '')==='logout') {
    protect(); audit('logout','users');
    $_SESSION=[];
    setcookie(session_name(),'', ['expires'=>time()-3600,'path'=>'/','httponly'=>true,'samesite'=>'Lax','secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off']);
    session_destroy(); respond(null,'Signed out.');
}
if (($d['action'] ?? '')!=='login') fail('Unknown action.',400);
$email=text_value($d,'email',150);
$password=text_value($d,'password',1024);
if (!filter_var($email,FILTER_VALIDATE_EMAIL)) fail('Enter a valid email.');
if (($_SESSION['login_lock'] ?? 0)>time()) fail('Too many attempts. Wait 15 minutes.',429);
db()->beginTransaction();
$u=query('SELECT * FROM users WHERE email=? FOR UPDATE',[$email])->fetch();
if ($u && $u['locked_until'] && strtotime($u['locked_until'])>time()) { db()->commit(); fail('Too many attempts. Wait 15 minutes.',429); }
if (!$u || !$u['is_active'] || !password_verify($password,$u['password_hash'])) {
    $_SESSION['login_failures']=($_SESSION['login_failures'] ?? 0)+1;
    if ($_SESSION['login_failures']>=5) { $_SESSION['login_lock']=time()+900; $_SESSION['login_failures']=0; }
    if ($u) {
        $n=($u['locked_until'] ? 0 : (int)$u['failed_attempts'])+1;
        query('UPDATE users SET failed_attempts=?,locked_until=? WHERE user_id=?',[$n,$n>=5?date('Y-m-d H:i:s',time()+900):null,$u['user_id']]);
    }
    db()->commit(); fail('Invalid email or password.',401);
}
query('UPDATE users SET failed_attempts=0,locked_until=NULL,last_login=NOW() WHERE user_id=?',[$u['user_id']]);
session_regenerate_id(true);
$_SESSION=['user_id'=>$u['user_id'],'last_activity'=>time(),'csrf'=>bin2hex(random_bytes(32))];
audit('login','users'); db()->commit();
respond(['user'=>user(),'csrf'=>$_SESSION['csrf']],'Signed in.');
