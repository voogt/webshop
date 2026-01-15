// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

// shopping cart
frappe.provide("webshop.webshop.shopping_cart");
var shopping_cart = webshop.webshop.shopping_cart;

var getParams = function (url) {
	var params = [];
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};

frappe.ready(function() {
	var user = frappe.session && frappe.session.user;

	shopping_cart.show_cart_navbar();

    if (user && user !== 'Guest') {

        if (localStorage.getItem("guest_cart")) {
			
			let guestCart = JSON.parse(localStorage.getItem("guest_cart"));
		
			const updateCartSequentially = async () => {
				for (const item of guestCart) {
					await update_cart_ajax({
						item_code: item.item_code,
						qty: item.qty,
						additional_notes: item.additional_notes,
						with_items: 1,
						callback: function (r) {
							var btn = document.getElementById('btn-add-to-cart') 
							$(btn).addClass('hidden');
							$(btn).closest('.cart-action-container').addClass('d-flex');
							$(btn).parent().find('.go-to-cart').removeClass('hidden');
							$(btn).parent().find('.go-to-cart-grid').removeClass('hidden');
							$(btn).parent().find('.cart-indicator').removeClass('hidden');
							document.getElementById('view-in-cart').classList.remove('hidden')
						},
					});
				}
				// Refresh cart display
				shopping_cart.set_cart_count(true);
				shopping_cart.show_shoppingcart_dropdown();
				
			};
		
			updateCartSequentially().then(() => {
				localStorage.removeItem("guest_cart");
				console.log("Guest cart synchronized and cleared.");
			}).catch((err) => {
				console.error("Error updating cart:", err);
			});
		}
    }
});

function update_cart_ajax (opts) {
    shopping_cart.freeze();
    return frappe.call({
        type: "POST",
        method: "webshop.webshop.shopping_cart.cart.update_cart",
        args: {
            item_code: opts.item_code,
            qty: opts.qty,
            additional_notes: opts.additional_notes !== undefined ? opts.additional_notes : undefined,
            with_items: opts.with_items || 0,
        },
        btn: opts.btn,
        callback: function (r) {
			shopping_cart.unfreeze();
			shopping_cart.set_cart_count(true);
			if (opts.callback) opts.callback(r);
			// Reload page after cart update
			window.location.reload();
        },
    });
}

$.extend(shopping_cart, {
	show_shoppingcart_dropdown: function() {
		$(".shopping-cart").on('shown.bs.dropdown', function() {
			if (!$('.shopping-cart-menu .cart-container').length) {
				return frappe.call({
					method: 'webshop.webshop.shopping_cart.cart.get_shopping_cart_menu',
					callback: function(r) {
						if (r.message) {
							$('.shopping-cart-menu').html(r.message);
						}
					}
				});
			}
		});
	},

	update_cart: function(opts) {
		// if (frappe.session.user==="Guest") {
		// 	if (localStorage) {
		// 		localStorage.setItem("last_visited", window.location.pathname);
		// 	}
		// 	frappe.call('webshop.webshop.api.get_guest_redirect_on_action').then((res) => {
		// 		window.location.href = res.message || "/login";
		// 	});
		// } else {
		// 	shopping_cart.freeze();
		// 	return frappe.call({
		// 		type: "POST",
		// 		method: "webshop.webshop.shopping_cart.cart.update_cart",
		// 		args: {
		// 			item_code: opts.item_code,
		// 			qty: opts.qty,
		// 			additional_notes: opts.additional_notes !== undefined ? opts.additional_notes : undefined,
		// 			with_items: opts.with_items || 0
		// 		},
		// 		btn: opts.btn,
		// 		callback: function(r) {
		// 			shopping_cart.unfreeze();
		// 			shopping_cart.set_cart_count(true);
		// 			if(opts.callback)
		// 				opts.callback(r);
		// 		}
		// 	});
		// }
		if (frappe.session.user === "Guest") {
			if (localStorage) {
				let guestCart = JSON.parse(localStorage.getItem("guest_cart")) || [];
	
				let existingItem = guestCart.find((item) => item.item_code === opts.item_code);
				if (existingItem) {
					existingItem.qty += opts.qty;
				} else {
					guestCart.push({
						item_code: opts.item_code,
						qty: opts.qty,
						additional_notes: opts.additional_notes,
					});
				}
	
				localStorage.setItem("guest_cart", JSON.stringify(guestCart));
			}
	
			if (localStorage) {
				localStorage.setItem("last_visited", window.location.pathname);
			}
	
			frappe.call("webshop.webshop.api.get_guest_redirect_on_action").then((res) => {
				window.location.href = res.message || "/login";
			});
		} else {
			shopping_cart.freeze();
			return frappe.call({
				type: "POST",
				method: "webshop.webshop.shopping_cart.cart.update_cart",
				args: {
					item_code: opts.item_code,
					qty: opts.qty,
					additional_notes: opts.additional_notes !== undefined ? opts.additional_notes : undefined,
					with_items: opts.with_items || 0,
				},
				btn: opts.btn,
				callback: function (r) {
					shopping_cart.unfreeze();
					shopping_cart.set_cart_count(true);
					if (opts.callback) opts.callback(r);
					// Reload page after cart update
					window.location.reload();
				},
			});
		}
	},

	set_cart_count: function(animate=false) {
		$(".intermediate-empty-cart").remove();

		// Read cart count from cookie; if unavailable during async updates, fall back to DOM rows
		var cart_count_cookie = frappe.get_cookie("cart_count");
		var cart_count = parseInt(cart_count_cookie, 10);
		if (isNaN(cart_count)) {
			cart_count = $(".cart-items tr").length || 0;
		}
		if (frappe.session.user === "Guest") {
			cart_count = 0;
		}

		if(cart_count) {
			$(".shopping-cart").toggleClass('hidden', false);
		}

		var $cart = $('.cart-icon');
		var $badge = $cart.find("#cart-count");
		console.log("cart_count:", cart_count);

		if(parseInt(cart_count) === 0 || cart_count === undefined) {
			$cart.css("display", "none");
			$(".cart-tax-items").hide();
			$(".btn-place-order").hide();
			$(".cart-payment-addresses").hide();

			let intermediate_empty_cart_msg = `
				<div class="text-center w-100 intermediate-empty-cart mt-4 mb-4 text-muted">
					${ __("Cart is Empty") }
				</div>
			`;
			$(".cart-table").after(intermediate_empty_cart_msg);
		}
		else {
			$cart.css("display", "inline");
			$("#cart-count").text(cart_count);
			// Ensure previously hidden sections are shown again when cart has items
			$(".cart-tax-items").show();
			$(".btn-place-order").show();
			$(".cart-payment-addresses").show();
		}

		if(cart_count) {
			$badge.html(cart_count);

			if (animate) {
				$cart.addClass("cart-animate");
				setTimeout(() => {
					$cart.removeClass("cart-animate");
				}, 500);
			}
		} else {
			$badge.remove();
		}
	},

	shopping_cart_update: function({item_code, qty, cart_dropdown, additional_notes}) {
		shopping_cart.update_cart({
			item_code,
			qty,
			additional_notes,
			with_items: 1,
			btn: this,
			callback: function(r) {
				if(!r.exc) {
					$(".cart-items").html(r.message.items);
					$(".cart-tax-items").html(r.message.total);
					$(".payment-summary").html(r.message.taxes_and_totals);
					shopping_cart.set_cart_count();

					if (cart_dropdown != true) {
						$(".cart-icon").hide();
					}
				}
			},
		});
	},

	show_cart_navbar: function () {
		frappe.call({
			method: "webshop.webshop.doctype.webshop_settings.webshop_settings.is_cart_enabled",
			callback: function(r) {
				$(".shopping-cart").toggleClass('hidden', r.message ? false : true);
			}
		});
	},

	toggle_button_class(button, remove, add) {
		button.removeClass(remove);
		button.addClass(add);
	},

	bind_add_to_cart_action() {
		$('.page_content').on('click', '.btn-add-to-cart-list', (e) => {
			const $btn = $(e.currentTarget);
			$btn.prop('disabled', true);

			if (frappe.session.user==="Guest") {
				if (localStorage) {
					localStorage.setItem("last_visited", window.location.pathname);
				}
				frappe.call('webshop.webshop.api.get_guest_redirect_on_action').then((res) => {
					window.location.href = res.message || "/login";
				});
				return;
			}

			$btn.addClass('hidden');
			$btn.closest('.cart-action-container').addClass('d-flex');
			$btn.parent().find('.go-to-cart').removeClass('hidden');
			$btn.parent().find('.go-to-cart-grid').removeClass('hidden');
			$btn.parent().find('.cart-indicator').removeClass('hidden');

			const item_code = $btn.data('item-code');
			webshop.webshop.shopping_cart.update_cart({
				item_code,
				qty: 1
			});

			window.location.reload();

		});
	},

	freeze() {
		if (window.location.pathname !== "/cart") return;

		if (!$('#freeze').length) {
			let freeze = $('<div id="freeze" class="modal-backdrop fade"></div>')
				.appendTo("body");

			setTimeout(function() {
				freeze.addClass("show");
			}, 1);
		} else {
			$("#freeze").addClass("show");
		}
	},

	unfreeze() {
		if ($('#freeze').length) {
			let freeze = $('#freeze').removeClass("show");
			setTimeout(function() {
				freeze.remove();
			}, 1);
		}
	}
});
