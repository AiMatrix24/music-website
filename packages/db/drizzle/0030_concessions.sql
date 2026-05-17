CREATE TYPE "public"."concession_order_status" AS ENUM('completed', 'voided');--> statement-breakpoint
CREATE TABLE "concession_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid,
	"item_name_snapshot" text NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concession_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"sold_by_user_id" uuid,
	"buyer_name" text,
	"total_cents" integer NOT NULL,
	"payment_method" text,
	"status" "concession_order_status" DEFAULT 'completed' NOT NULL,
	"notes" text,
	"voided_at" timestamp with time zone,
	"voided_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"price_cents" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "concession_order_items" ADD CONSTRAINT "concession_order_items_order_id_concession_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."concession_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concession_order_items" ADD CONSTRAINT "concession_order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concession_orders" ADD CONSTRAINT "concession_orders_contract_id_booking_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."booking_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concession_orders" ADD CONSTRAINT "concession_orders_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concession_orders" ADD CONSTRAINT "concession_orders_sold_by_user_id_users_id_fk" FOREIGN KEY ("sold_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concession_orders" ADD CONSTRAINT "concession_orders_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "concession_order_items_order_idx" ON "concession_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "concession_orders_contract_idx" ON "concession_orders" USING btree ("contract_id","status");--> statement-breakpoint
CREATE INDEX "concession_orders_venue_idx" ON "concession_orders" USING btree ("venue_id","created_at");--> statement-breakpoint
CREATE INDEX "menu_items_venue_idx" ON "menu_items" USING btree ("venue_id","active");