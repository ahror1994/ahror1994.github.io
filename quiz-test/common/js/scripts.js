$(document).ready(function($) {

	function declOfNum(number, titles) {  
	    cases = [2, 0, 1, 1, 1, 2];  
	    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];  
	}
	
	// Карусель вопросов/ответов
	var quizSlider = $('.quiz-slider').addClass('owl-carousel');

	quizSlider.on('initialized.owl.carousel', function(e) {
		
		var percentLoad = (100 / e.item.count) * (e.item.index + 1);
		$('.progress-bar__inline span').css('width', percentLoad + '%');

		var countResults = $('.home-results__count').text();
		$('.home-results__count').text(countResults + ' ' + declOfNum(countResults, ['проект', 'проекта', 'проектов']));

		var curIndex = e.item.index + 1;
		try {
			yaCounter45639600.reachGoal('SMARTO_Q' + curIndex);
		} catch (e) {};

	});

	quizSlider.owlCarousel({
		items: 1,
		autoHeight:true,
		animateOut: 'fadeOutUp',
    	animateIn: 'fadeInUp',
    	touchDrag: false,
    	mouseDrag: false
	});

	quizSlider.on('translate.owl.carousel', function(e) {

		$('.next-questions').addClass('disabled');
		if(e.item.index + 1 == e.page.count){
			$('.next-questions').addClass('remove');
		}

		var percentLoad = (100 / e.item.count) * (e.item.index + 1);
		$('.progress-bar__inline span').css('width', percentLoad + '%');

		var curIndex = e.item.index + 1;
		try {
			yaCounter45639600.reachGoal('SMARTO_Q' + curIndex);
		} catch (e) {};

	});

	// Проверка на выбранный вариант
	$(document).on('change', '.quiz-slider .owl-item.active input[type="radio"], .quiz-slider .owl-item.active input[type="checkbox"]', function(event) {
		event.preventDefault();
		if($(this).prop('checked')){
			$('.next-questions').removeClass('disabled');
		}
	});

	// Клик на след шаг
	$(document).on('click', '.next-questions', function(event) {
		event.preventDefault();
		if(!$(this).hasClass('disabled')){
			quizSlider.trigger('next.owl.carousel');
		}
		if($('.home-results').hasClass('home-results_disable')){
			$('.home-results').removeClass('home-results_disable');
		}
		
	});

	// Карусель результатов
	
	$('.home-results__slider-js').slick({
		slidesToShow: 1,
		slidesToScroll: 1
	});

	$('.home-results__slider-js').on('afterChange', function(event, slick, currentSlide, nextSlide){
	  	var slider = $('.home-results__slider-js'),
	  		cur = slider.slick("slickCurrentSlide"),
			$slides = slider.slick("getSlick").$slides,
			currentItem = $slides.eq( cur ).get(0),
			currentItemPrevu = $(currentItem).find('.home-item__prevu'),
			currentItemPrevuUrl = $(currentItemPrevu).attr('data-url-prevu');

		if(!currentItemPrevu.attr('style')){
			currentItemPrevu.css('background-image', 'url('+currentItemPrevuUrl+')');
		}
	});

	function randomInteger(min, max) {
	    var rand = min - 0.5 + Math.random() * (max - min + 1)
	    rand = Math.round(rand);
	    return rand;
	}

	var $quizQuestions = $('.quiz-questions'),
		eqIndex = 0;

	$quizQuestions.on('change', '.item-slider_questions input:checkbox, .item-slider_questions input:radio', function(event) {
		
		var resultFilter = $(event.delegateTarget).fhelper('api').getFilter(),
			slider = $('.home-results__slider-js');

		$('.quiz-element').removeClass('filter-active');
		slider.slick('slickUnfilter');

		// $('.quiz-element').parent().hide();
		$.each(resultFilter, function(index, val) {
			$('.quiz-element[data-ide=' + val + ']').addClass('filter-active');
		});


		slider.slick('slickFilter', '.filter-active');

		eqIndex = randomInteger(1, resultFilter.length);
		slider.slick('slickGoTo', eqIndex, true);

		var cur = slider.slick("slickCurrentSlide"),
			$slides = slider.slick("getSlick").$slides,
			currentItem = $slides.eq( cur ).get(0),
			currentItemPrevu = $(currentItem).find('.home-item__prevu'),
			currentItemPrevuUrl = $(currentItemPrevu).attr('data-url-prevu');

		if(!currentItemPrevu.attr('style')){
			currentItemPrevu.css('background-image', 'url('+currentItemPrevuUrl+')');
		}

		var countResults = resultFilter.length;
		$('.home-results__count').attr('data-all-counts', countResults).text(countResults + ' ' + declOfNum(countResults, ['проект', 'проекта', 'проектов']));


	}).fhelper({
		url: 'filter.json'
	});

	quizSlider.on('translate.owl.carousel', function(e) {
		
		var cur = $(".home-results__slider-js").slick("slickCurrentSlide");
		var $slides = $(".home-results__slider-js").slick("getSlick").$slides;
		var currentItem = $slides.eq( cur ).get(0),
			currentItemPrevu = $(currentItem).find('.home-item__prevu'),
			currentItemPrevuUrl = $(currentItemPrevu).attr('data-url-prevu');

		if(!currentItemPrevu.attr('style')){
			currentItemPrevu.css('background-image', 'url('+currentItemPrevuUrl+')');
		}

	});

	$(document).on('form:success', '.form-quiz', function(event) {
		event.preventDefault();
		try {
			yaCounter45639600.reachGoal('SMARTO_END');
			yaglaaction('SMARTO_END');
		} catch (e) {};
		var resultFilter = $quizQuestions.fhelper('api').getFilter();
		window.location.href = '//wood-zavod.ru/filter/1?' + $.param({e: resultFilter.join(',')});
	});

	$('.input').focus(function(event) {
		if(!$(this).val().length){
			$(this).parent().addClass('completed');
		}
	}).blur(function(event) {
		if(!$(this).val().length){
			$(this).parent().removeClass('completed');
		}
	});

	// Проверка на заполненность
	$(document).on('keyup', '.input', function(event) {
		event.preventDefault();
		if($(this).val().length){
			$(this).parent().addClass('completed');
		} else {
			$(this).parent().removeClass('completed');
		}
	});

	// Маска ввода
	if(!$('#quiz').length){
		$('[name="PHONE"]').mask('+7 (000) 000-00-00');
	}

});