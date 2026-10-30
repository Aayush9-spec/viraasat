"""Integration test against an isolated postgres:16 container, never production.
Usage: python database/tests/commerce_migrations.py <test-container-name>
The container must already exist. Creates a disposable database named viraasat_test.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json, subprocess, sys, uuid
name = sys.argv[1]
base = ['docker', '--host=unix:///var/run/docker.sock', 'exec', '-i', name, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At']
def sql(statement, database='viraasat_test', ok=True):
    r=subprocess.run(base+['-d',database],input=statement,text=True,capture_output=True)
    if ok and r.returncode: raise AssertionError(r.stderr)
    return r
sql('DROP DATABASE IF EXISTS viraasat_test; CREATE DATABASE viraasat_test;', 'postgres')
sql("""
DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE SCHEMA storage;
CREATE TABLE storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
CREATE TABLE users(id uuid primary key default gen_random_uuid(),email text unique,display_name text,role text);
CREATE TABLE products(id uuid primary key,name text,price numeric,stock integer,artisan_id uuid,images jsonb);
CREATE TABLE artisan_applications(id uuid primary key,status text);
CREATE TABLE reviews(id uuid primary key);
CREATE TABLE wishlists(user_id uuid, product_id uuid, unique(user_id,product_id));
""")
root=Path(__file__).resolve().parents[1]
for _ in range(2): # migration reruns must be safe
    for migration in ['commerce_security_migration.sql','commerce_completion_migration.sql']:
        sql((root/migration).read_text())
seller=str(uuid.uuid4()); product=str(uuid.uuid4()); other=str(uuid.uuid4())
sql(f"INSERT INTO products(id,price,stock,artisan_id,is_active) VALUES ('{product}',100,1,'{seller}',true),('{other}',100,0,'{seller}',true)")
def create(items=None):
    oid=str(uuid.uuid4()); key=str(uuid.uuid4())
    payload=json.dumps({'items':items or [{'productId':product,'artisanId':seller,'quantity':1,'unitPrice':100}]})
    return oid, sql(f"INSERT INTO commerce_orders(id,buyer_id,idempotency_key,request_hash,amount,payload) VALUES ('{oid}','buyer','{key}','hash',11800,'{payload}')",ok=False)
with ThreadPoolExecutor(2) as pool: outcomes=list(pool.map(lambda _:create(),range(2)))
assert sum(r.returncode==0 for _,r in outcomes)==1, outcomes
paid_id=next(i for i,r in outcomes if r.returncode==0)
assert sql(f"SELECT stock FROM products WHERE id='{product}'").stdout.strip()=='0'
sql(f"UPDATE commerce_orders SET payment_id='pay_first',payment_status='Paid' WHERE id='{paid_id}'")
sql(f"UPDATE commerce_orders SET refunded_amount=4000 WHERE id='{paid_id}'")
assert sql(f"SELECT payment_status FROM commerce_orders WHERE id='{paid_id}'").stdout.strip()=='Partially Refunded'
sql(f"UPDATE commerce_orders SET refunded_amount=11800 WHERE id='{paid_id}'")
sql(f"UPDATE commerce_orders SET payment_status='Paid',refunded_amount=0 WHERE id='{paid_id}'")
assert sql(f"SELECT payment_status FROM commerce_orders WHERE id='{paid_id}'").stdout.strip()=='Refunded'
assert sql(f"SELECT stock FROM products WHERE id='{product}'").stdout.strip()=='1'
# Failed multi-item reservation rolls back all stock changes.
_,r=create([{'productId':product,'artisanId':seller,'quantity':1,'unitPrice':100},{'productId':other,'artisanId':seller,'quantity':1,'unitPrice':100}]);assert r.returncode
assert sql(f"SELECT stock FROM products WHERE id='{product}'").stdout.strip()=='1'
_,r=create([{'productId':product,'artisanId':seller,'quantity':1,'unitPrice':99}]);assert r.returncode
# Shipped items are not automatically restocked on refund.
shipped,r=create();assert r.returncode==0
shipment=json.dumps({seller:{'status':'Shipped'}})
sql(f"UPDATE commerce_orders SET fulfillment='{shipment}', payment_status='Paid',payment_id='pay_second' WHERE id='{shipped}'")
sql(f"UPDATE commerce_orders SET refunded_amount=11800 WHERE id='{shipped}'")
assert sql(f"SELECT stock FROM products WHERE id='{product}'").stdout.strip()=='0'
assert sql('SET ROLE anon; SELECT * FROM commerce_orders',ok=False).returncode
assert sql('SET ROLE authenticated; DELETE FROM wishlists',ok=False).returncode
print('PASS: migrations rerun; concurrent last-unit purchase; partial/full refunds; late capture; one-time restock; cart rollback; price race; shipped returns; access grants')
