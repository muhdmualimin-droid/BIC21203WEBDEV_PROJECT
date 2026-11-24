<?php
require __DIR__.'/../includes/init.php';
if ($method!=='POST') fail('Use POST.',405);
$d=input();
$name=text_value($d,'name',100); $email=text_value($d,'email',150); $subject=text_value($d,'subject',150); $body=text_value($d,'body',5000);
if (!filter_var($email,FILTER_VALIDATE_EMAIL)) fail('Enter a valid email address.');
if (mb_strlen($body)<10) fail('Write at least 10 characters.');
if (time()-($_SESSION['contact_at'] ?? 0)<20) fail('Please wait 20 seconds before sending another message.',429);
query('INSERT INTO messages (name,email,subject,body,ip) VALUES (?,?,?,?,?)',[$name,$email,$subject,$body,$_SERVER['REMOTE_ADDR'] ?? null]);
$_SESSION['contact_at']=time(); respond(null,'Thank you. Your message has been received.',201);
