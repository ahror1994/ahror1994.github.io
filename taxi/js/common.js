$(function() {

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

// Табы
  $('ul.tabs__caption').on('click', 'li:not(.active)', function() {
    $(this)
      .addClass('active').siblings().removeClass('active')
      .closest('div.tabs').find('div.tabs__content').removeClass('active').eq($(this).index()).addClass('active');
  });

// Слайдер
  $('.slider1').owlCarousel({
    loop: true,
    margin: 50,
    dots:false,
    autoplay: true,
    autoplayTimeout: 3000,
    nav: true,
    items:1
  })

//E-mail Ajax Send
  $("form").submit(function () { //Change
    var th = $(this);
    $.ajax({
      type: "POST",
      url: "mail.php", //Change
      data: th.serialize()
    }).done(function () {
      window.location.href = "/thx.html";
      setTimeout(function () {
        // Done Functions
        th.trigger("reset");
      }, 1000);
    });
    return false;
  });

// Маски
  $(".phone").mask("+7 (999) 999-99-99");

});
