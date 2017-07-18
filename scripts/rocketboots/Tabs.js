(function(){
	var component = {
		fileName: 		"Tabs",
		classNames:		["Tabs"],
		requirements:	[], 
		description:	"",
		credits:		"By Luke Nickerson, 2016-2017"
	};

	var Tabs = component.Tabs = function TabsClass (options){
		this.setOptions(options);
	};

	/* EXAMPLE HTML:
		<section class="tabs">
			<ol>
				<li><a href="#hopes" class="hopes">Hopes</a></li
				><li><a href="#dreams" class="dreams">Grimoires</a>
			</ol>
		</section>
		<section class="tabbed-content-container">
			<div class="hopes">
				<!-- Tab content -->
			</div>
			<div class="dreams">
				<!-- Tab content -->
			</div>
		</section>
	*/

	/* EXAMPLE CSS:
		.tabs > ol {
			display: block;
			padding: 0;
			margin: 0;
			width: 100%;
			text-align: center;
		}
		.tabs > ol > li {
			padding: 0;
			margin: 0;
			display: inline-block;
			box-sizing: border-box;
			width: 25%;	
		}
		.tabs > ol a {
			display: inline-block;
			width: 100%;
			padding: 1em 0;
		}
			.tabs > ol a.selected {
				background-color: rgba(255,255,255,0.3);
				box-shadow: 0 0 0.5em rgba(0,0,0,0.2);
			}

		.tabbed-content-container > div {
			display: none;
		}
			.tabbed-content-container > div.selected {

				display: block;
			}
	*/

	Tabs.prototype.setOptions = function (options) {
		var defaults = {
			containerSelector: 				'.tabs-container',
			tabbedContentContainerSelector: 	'.tabbed-content-container',
			tabbedContentSelector: 				'div',
			tabsContainerSelector: 				'.tabs',
			tabsSelector: 						'a',
			selectedClass: 						'selected',
			$nav: 								null,
			$content: 							null,
			showWithJQuery: 					false,
			closeClass: 						'close'
		};
		$.extend(this, defaults, options);
		return this;	
	};

	Tabs.prototype.setup = function (options) {	
		var tabs = this;
		var navSelector;
		var contentSelector;
		if (typeof options === 'object') {
			tabs.setOptions(options);
		}
		contentSelector = tabs.tabbedContentContainerSelector + ' ' + tabs.tabbedContentSelector;
		navSelector = tabs.tabsContainerSelector + ' ' + tabs.tabsSelector;
		tabs.$content = $(contentSelector);
		tabs.$nav = $(navSelector);

		$(tabs.tabsContainerSelector).off("click").on("click", tabs.tabsSelector, function(e){
			tabs.selectByElement( $(e.target) );
		});

		if (tabs.showWithJQuery) {
			tabs.$content.hide();
		}

		return tabs;
	};

	Tabs.prototype.selectByElement = function ($elt) {
		var tabs = this;
		var goTo = $elt.data("goto");
		if (typeof goTo === 'undefined') {
			var href = $elt.attr("href");
			if (typeof href !== 'undefined') {
				goTo = href.split('#')[1];
			}
		}
		tabs.select(goTo, $elt);
		return tabs;	
	};

	Tabs.prototype.select = function(goToClass, $selectedNav) {
		var tabs = this;
		var $selected = tabs.$content.filter('.' + goToClass);
		var $notSelected = tabs.$content.not($selected);

		if (goToClass === tabs.closeClass) {
			this.close();
		} else {

			if (typeof $selectedNav === 'undefined') {
				$selectedNav = tabs.$nav.filter('.'+ goToClass);
			}
			// Remove selected class from tab content and tab links
			$notSelected.add(tabs.$nav).not($selectedNav).removeClass(tabs.selectedClass);
			// Add selected class
			$selected.add($selectedNav).addClass(tabs.selectedClass);
			if (tabs.showWithJQuery) {
				$selected.show();
				$notSelected.hide();
			}
		}
		return tabs;
	};

	Tabs.prototype.open = function () {
		var tabs = this;
		$(tabs.containerSelector).show();
		return tabs;
	};

	Tabs.prototype.close = function () {
		var tabs = this;
		$(tabs.containerSelector).hide();
		return tabs;
	};



	// Install into RocketBoots if it exists
	if (typeof RocketBoots === "object") {
		RocketBoots.installComponent(component);
	} else { // Otherwise put the classes on the global window object
		for (var i = 0; i < component.classNames.length; i++) {
			window[component.classNames[i]] = component[component.classNames[i]];
		}
	}

})();