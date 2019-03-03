"use strict";

(function ($) {

	// JQUERY
	$(document).ready(function () {

		$('.subtitle-slider').slick({
			arrows: false,
			vertical: true,
			autoplay: true,
			adaptiveHeight: true,
			swipe: false,
			touchMove: false,
			accessibility: false
		});
	});
})(jQuery);