<?php 
//required
$siteip = $_SERVER['REMOTE_ADDR'];
 
  
if (isset($_POST['name'])) {$name = $_POST['name'];} 
if (isset($_POST['phone'])) {$phone = $_POST['phone'];}   
if (isset($_POST['emailz'])) {$emailz = $_POST['emailz'];}   
  
 
if (isset($_POST['step1'])) {$step1 = $_POST['step1'];} 
if (isset($_POST['step2'])) {$step2 = $_POST['step2'];} 
if (isset($_POST['step3'])) {$step3 = $_POST['step3'];} 
 
 
 
 
 
 
if (isset($_POST['step11'])) {$step11 = $_POST['step11'];}
if (isset($_POST['step12'])) {$step12 = $_POST['step12'];}
if (isset($_POST['step13'])) {$step13 = $_POST['step13'];}
if (isset($_POST['step14'])) {$step14 = $_POST['step14'];}
if (isset($_POST['step15'])) {$step15 = $_POST['step15'];}
if (isset($_POST['step16'])) {$step16 = $_POST['step16'];}
if (isset($_POST['step17'])) {$step17 = $_POST['step17'];}
if (isset($_POST['step18'])) {$step18 = $_POST['step18'];}
if (isset($_POST['step19'])) {$step19 = $_POST['step19'];}
if (isset($_POST['step20'])) {$step20 = $_POST['step20'];}
 

if (isset($_POST['auto'])) {$auto = $_POST['auto'];} 
 
  
$address  = 'stolica077@yandex.ru';
$sub="Заказ ВИВАНА"; 
$email='admin@site.ru'; 

$mes = "
Телефон: $phone
<br>
<hr>
<br>
Какое оборудование вам необходимо?  $step11 $step12 $step13 $step14  $step15 $step16 $step17 $step18 $step19 $step20<br>
$step2<br>
$step3<br>
 


<br>
IP-адрес посетителя: $siteip
<br>
";  
 

   

$send = mail ($address,$sub,$mes,"Content-type:text/html; charset = utf-8\r\nFrom:$email");
?> 
<html lang="ru"><head>
    <meta charset="UTF-8">
    <title>Спасибо!</title>
<style>
body {
    color: #313E47;
    font-family: Arial;
    font-size: 15px;
    line-height: 1;
    text-align: center;
    padding-top: 20px;
}
h2 {
    color: #313E47;
    font-size: 36px;
    font-weight: 700;
    line-height: 44px;
    text-align: center;
    text-transform: uppercase;
}
</style>
</head>
<body>   
	<h2>Поздравляем! Ваш заказ принят!</h2>
    <p class="success">В ближайшее время с вами свяжется оператор для подтверждения заказа. Пожалуйста, включите ваш контактный телефон.</p>
    <h1 style="color:#FF0000; text-align: center;">Спасибо что выбрали нас!</h1> 
	 
</body>
</html>