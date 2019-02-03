$(function() {

// спойлер
$('.section8-block').click(function() {
	$(this).find('.faq-content').slideToggle();
});

// Слайдер
$(".slider1").owlCarousel({
  animateOut: "fadeOut",
  animateIn: "flipInY",
  mouseDrag: true,
  touchDrag: true,
  items: 1,
  margin: 50,
  autoplay: true,
  autoplayTimeout: 2000,
  stagePadding: 30,
  responsiveClass: true,
  responsive: {
    768: {
      animateOut: "fadeOut",
      animateIn: "flipInX",
      mouseDrag: false,
      touchDrag: false,
      margin: 30
    }
  },
  smartSpeed: 450
});

// Маска
$(".phone").mask("+7 (999) 999-99-99");

// magnific popup
$('.image-popup-zoom').magnificPopup({
    type: 'image',
    zoom: {
        enabled: true,
        duration: 300
    }
 });

$('.popup-with-zoom-anim').magnificPopup({
   type: 'inline',
   removalDelay: 300,
   mainClass: 'my-mfp-zoom-in'
});

//E-mail Ajax Send
  $("form").submit(function() { //Change
    var th = $(this);
    $.ajax({
      type: "POST",
      url: "mail.php", //Change
      data: th.serialize()
    }).done(function() {
      window.location.href = "/thx.html";
      setTimeout(function() {
        // Done Functions
        th.trigger("reset");
      }, 1000);
    });
    return false;
  });

});
