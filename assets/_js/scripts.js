"use strict";
	
(function($){

	// JQUERY
	$(document).ready(function() {

		var FHelper = function(element, options) {
			var $elem = $(element),
				obj = this,
				answersFilter = [];

			var settings = $.extend({
				url: null,
				questionsGroup: '.filter',
				answerGroup: '.answer-group'

			}, options || {});

			var init = function(callback) {
				$.getJSON(settings.url, function(json) {
					callback(json.data.result.answers);
				});
			};

			// Получить элементы фильтрации
			this.getElements = function() {
				return answersFilter;
			};

			// Получить текущий фильтр
			this.getFilter = function() {
				var resultFilter = [];
				// Применение фильтра
				$elem.find(settings.questionsGroup).each(function() {
					var currentFilter = [],
						tempFilter = [];
					$(this).find(settings.answerGroup).find('input:checked').each(function() {
						var ida = $(this).parents(settings.answerGroup).data('ida') - 1;
						if (typeof answersFilter[ida] !== 'undefined') {
							currentFilter = currentFilter.concat(answersFilter[ida].elementId);
						}
					});
					if (currentFilter.length) {
						if (resultFilter.length) {
							tempFilter = currentFilter.filter(x => resultFilter.includes(x));
							if (tempFilter.length) resultFilter = tempFilter;
						} else {
							resultFilter = currentFilter;
						}
					}					
				});
				return resultFilter;
			};

			if (settings.url) {
				init(function(data) {
					answersFilter = data;
					$elem.trigger('fhelper:init');
					$(settings.answerGroup).each(function(index) {
						$(this).data('ida', index + 1);
					});
				});
			}
		};

		$.fn.fhelper = function(options) {
			var element = $(this);
			if (element.data('fhelper') || options == 'api') return element.data('fhelper');
			var fhelper = new FHelper(this, options);
			element.data('fhelper', fhelper);
			return fhelper;
		};

		// AJAX Форма
		$('.form-std').ajaxForm({
			resetForm: false, // Сбросить форму после заявки
			dataType: 'json',
			beforeSubmit: function beforeSubmit(formData, $form, options) {
				for (var i = 0; i < formData.length; i++) {
					if (!formData[i].value && formData[i].required == true && navigator.userAgent.search(/Safari/) > -1) {
						alert('Пожалуйста, заполните необходимые поля');
						return false;
					}
				}
				beforeSubmitAction($form);
				return true;
			},
			success: function success(json, statusText, xhr, $form) {
				console.log(json);				
				try {
					// Выполнение цели / Триггер Google Tag Manager
					dataLayer.push({'event': $form.find('input[name=GOAL_FORM]').val()});
				} catch (e) {};
				
				if (json.status != 'error') {
					var event = $.Event("form:success", {'json': json});
					$form.trigger(event);
					if (!event.isDefaultPrevented()) swal(json.title, json.message, "success");
				} else {
					swal(json.title, json.message, "error");
				}
				successAction($form);
				return false;
			},
			error: function(data){
				console.log(data);
			}
		});
	});    
})(jQuery);

function beforeSubmitAction($form) {
	$form.find('*[type="submit"]').prop('disabled', true);
	return true;
};

function successAction($form) {
	$form.find('*[type="submit"]').prop('disabled', false).remove();
	return true;
}