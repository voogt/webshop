# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
# License: GNU General Public License v3. See license.txt

import frappe
from frappe import _
from frappe.utils import add_to_date, now_datetime

KARTOZA_URL = "https://kartoza.com"


def send_cart_reminder_emails():
	"""Remind customers who left items in their shopping cart for more than a day."""
	if not frappe.db.get_single_value("Selling Settings", "enable_cart_reminder_emails"):
		return

	reminder_cutoff = add_to_date(now_datetime(), days=-1)

	abandoned_carts = frappe.get_all(
		"Quotation",
		fields=["name", "contact_email", "customer_name", "party_name"],
		filters={
			"order_type": "Shopping Cart",
			"docstatus": 0,
			"status": ["in", ("Draft", "Open")],
			"contact_email": ["not in", ("", None)],
			"modified": ["<=", reminder_cutoff],
		},
	)

	for cart in abandoned_carts:
		if reminder_already_sent(cart.name):
			continue

		send_cart_reminder_email(cart)


def reminder_already_sent(quotation):
	"""Check if a cart reminder email was already sent for this quotation."""
	return frappe.db.exists(
		"Communication",
		{
			"reference_doctype": "Quotation",
			"reference_name": quotation,
			"subject": cart_reminder_subject(),
		},
	)


def send_cart_reminder_email(cart):
	"""Send a single abandoned cart reminder email."""
	message = frappe.render_template(
		"templates/emails/cart_reminder.html",
		{
			"customer_name": cart.customer_name or cart.party_name,
			"cart_url": KARTOZA_URL,
		},
	)

	frappe.sendmail(
		recipients=[cart.contact_email],
		subject=cart_reminder_subject(),
		message=message,
		reference_doctype="Quotation",
		reference_name=cart.name,
	)


def cart_reminder_subject():
	"""Subject line used for abandoned cart reminder emails."""
	return _("You still have a course waiting in your cart")
