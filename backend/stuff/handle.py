import base64
import json
import os
import random
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from io import BytesIO
from typing import List

import bcrypt
from dotenv import load_dotenv
from fastapi import File, Form, HTTPException, UploadFile
from PIL import Image

from stuff import database, model

load_dotenv()


def send_otp_email(receiver_email, otp):
    sender_email = os.getenv("OTP_SENDER_EMAIL")  # Enter your email address
    sender_password = os.getenv("OTP_SENDER_PASSWORD")  # Enter your email password
    # print(sender_email + " " + sender_password)

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = "Your One Time Password (OTP)"
    body = (
        f"Welcome to TradeThrill. Your OTP to start your experience with us is: {otp}"
    )
    message.attach(MIMEText(body, "plain"))
    # print("Reached")

    # server = smtplib.SMTP('smtp.cc.iitk.ac.in', 465)
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(sender_email, sender_password)
    text = message.as_string()
    server.sendmail(sender_email, receiver_email, text)
    server.quit()


# inside handle.py


async def handle_register(data: model.User_For_Registration):
    conn, cursor = database.make_db()

    try:
        # 1. Check for reports (Ban check)
        cursor.execute(
            "SELECT COUNT(*) FROM reports WHERE reported_id = %s", (data.user_id,)
        )
        if cursor.fetchone()[0] >= 7:
            raise HTTPException(
                status_code=403, detail="User access restricted due to reports"
            )

        # 2. Check if user already exists
        cursor.execute("SELECT verified FROM users WHERE user_id = %s", (data.user_id,))
        result = cursor.fetchone()

        otp = random.randrange(100000, 999999, 1)

        if result is None:
            # --- NEW USER ---

            # 3. Hash the password SECURELY here
            hashed_bytes = bcrypt.hashpw(
                data.password.encode("utf-8"), bcrypt.gensalt()
            )
            hashed_password = hashed_bytes.decode("utf-8")

            try:
                send_otp_email(data.email, otp)
            except Exception as e:
                print("Email Error:", e)
                raise HTTPException(status_code=500, detail="Could not send OTP")

            # 4. Insert using Parameterized Query (Safe)
            query = """INSERT INTO users (user_id, email, hashed_password, name, otp, verified) 
                       VALUES (%s, %s, %s, %s, %s, FALSE)"""
            cursor.execute(
                query, (data.user_id, data.email, hashed_password, data.name, otp)
            )

            # Initialize image entry
            cursor.execute(
                "INSERT INTO user_images (user_id, pic) VALUES (%s, NULL)",
                (data.user_id,),
            )
            conn.commit()
            return {"message": "OTP sent"}

        else:
            # --- EXISTING USER LOGIC ---
            verified = result[0]
            if not verified:
                # Resend OTP logic
                try:
                    send_otp_email(data.email, otp)
                except Exception:
                    raise HTTPException(status_code=500, detail="Could not send OTP")

                cursor.execute(
                    "UPDATE users SET otp = %s WHERE user_id = %s", (otp, data.user_id)
                )
                conn.commit()
                return {"message": "OTP resent"}
            else:
                raise HTTPException(status_code=400, detail="User already registered")

    finally:
        conn.close()


async def verify_otp(data: model.OTP):
    conn, cursor = database.make_db()
    try:
        query = f"SELECT otp FROM users WHERE user_id = '{data.user_id}'"
        cursor.execute(query)
        result = cursor.fetchone()

        if result and result[0] == data.otp:
            update_query = (
                f"UPDATE users SET verified = TRUE WHERE user_id = '{data.user_id}'"
            )
            cursor.execute(update_query)
            conn.commit()
            conn.close()
            return {"message": "success"}
        else:
            return {"message": "Wrong OTP"}
    except Exception as e:
        # error in verifying otp
        conn.rollback()  # Rollback any pending changes
        raise HTTPException(
            status_code=500, detail="Internal server error. Please try again later"
        )
    finally:
        conn.close()
    # conn.close()

    # return False


def otp_email_forgotpass(receiver_email, otp):
    sender_email = os.getenv("OTP_SENDER_EMAIL")  # Enter your email address
    sender_password = os.getenv("OTP_SENDER_PASSWORD")  # Enter your email password
    # print(sender_email + " " + sender_password)

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = "Your One Time Password (OTP)"
    body = f"Your OTP to change your password is: {otp}"
    message.attach(MIMEText(body, "plain"))
    # print("Reached")

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        text = message.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
    except Exception as e:
        # error in sending otp
        raise HTTPException(
            status_code=500, detail="Internal server error. Please try again later"
        )


async def forgot_password(data: model.ForgotPassword):
    conn, cursor = database.make_db()
    try:
        # 1. Check Ban Status
        cursor.execute(
            "SELECT COUNT(*) FROM reports WHERE reported_id = %s", (data.user_id,)
        )
        if cursor.fetchone()[0] >= 7:
            raise HTTPException(
                status_code=403, detail="User access restricted due to reports"
            )

        # 2. Check User Existence & Verification
        cursor.execute(
            "SELECT email, verified FROM users WHERE user_id = %s", (data.user_id,)
        )
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        email, verified = user
        if not verified:
            raise HTTPException(status_code=400, detail="User is not verified")

        # 3. HASH the New Password (Critical Step)
        # We must store the HASH, not the raw password
        hashed_bytes = bcrypt.hashpw(
            data.new_password.encode("utf-8"), bcrypt.gensalt()
        )
        hashed_new_password = hashed_bytes.decode("utf-8")

        # 4. Send OTP
        otp = random.randrange(100000, 999999, 1)
        try:
            otp_email_forgotpass(email, otp)
        except Exception:
            raise HTTPException(
                status_code=500, detail="Internal server error sending email"
            )

        # 5. Store in Change Password Table
        # Clean up old requests first
        cursor.execute(
            "DELETE FROM change_password WHERE user_id = %s", (data.user_id,)
        )

        # Insert User ID, HASHED Password, and OTP
        cursor.execute(
            "INSERT INTO change_password (user_id, new_password, otp) VALUES (%s, %s, %s)",
            (data.user_id, hashed_new_password, otp),
        )

        conn.commit()
        return data

    finally:
        conn.close()


async def new_otp(data: model.OTP):
    conn, cursor = database.make_db()
    try:
        # 1. Check OTP and Retrieve Hashed Password
        cursor.execute(
            "SELECT new_password FROM change_password WHERE user_id = %s AND otp = %s",
            (data.user_id, data.otp),
        )
        result = cursor.fetchone()

        if result:
            new_hashed_password = result[0]

            # 2. Update Main Users Table
            cursor.execute(
                "UPDATE users SET hashed_password = %s WHERE user_id = %s",
                (new_hashed_password, data.user_id),
            )

            # 3. Clean up
            cursor.execute(
                "DELETE FROM change_password WHERE user_id = %s", (data.user_id,)
            )

            conn.commit()
            return True
        else:
            raise HTTPException(status_code=400, detail="Invalid OTP")

    finally:
        conn.close()


async def get_user_info(user_id: int):
    conn, cursor = database.make_db()
    try:
        query = """
            SELECT u.user_id, u.email, u.name, u.verified, u.hashed_password, ui.pic 
            FROM users u 
            LEFT JOIN user_images ui ON u.user_id = ui.user_id
            WHERE u.user_id = %s
        """
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()

        if result:
            uid, email, name, verified, h_pwd, img_bytes = result

            pic_str = None
            if img_bytes:
                pic_str = base64.b64encode(img_bytes).decode("utf-8")

            return {
                "user_id": uid,
                "email": email,
                "name": name,
                "photo": pic_str,
                "verified": verified,
                "hashed_password": h_pwd,
            }
        return None
    finally:
        conn.close()


async def get_request_count(product_id: int, buyer_id: int):
    print("hello")
    conn, cursor = database.make_db()
    query = f"""SELECT COUNT(*) FROM notifications
                WHERE pid = {product_id} AND from_user = {buyer_id}"""
    print("query done")
    cursor.execute(query)
    result = cursor.fetchone()
    print(result[0])
    conn.close()
    if result:
        print("reached")
        return {"count": result[0]}

    else:
        print("else reached")
        return {"count": 0}


async def notify_request(data: model.Notification):
    conn, cursor = database.make_db()
    time = datetime.today().strftime("%Y-%m-%d")
    seller_id_query = (
        f"""select seller_id from products where product_id = '{data.pid}'"""
    )
    cursor.execute(seller_id_query)
    result = cursor.fetchone()
    seller_id = result[0]
    if seller_id == data.buyer_id:
        raise HTTPException(
            status_code=400, detail="You cannot request your own product"
        )
    query = f"""INSERT INTO notifications VALUES ('{data.buyer_id}', '{seller_id}', '{time}', 0, {data.pid})"""
    cursor.execute(query)
    conn.commit()
    conn.close()


async def notify_accept(data: model.Notifications):
    conn, cursor = database.make_db()
    time = datetime.today().strftime("%Y-%m-%d")
    query = f"""INSERT INTO notifications VALUES ('{data.seller_id}', '{data.buyer_id}', '{time}', 1, {data.pid})"""
    cursor.execute(query)
    sold_query = f"""insert into notifications values ('{data.buyer_id}', '{data.seller_id}', '{time}', 3, {data.pid})"""
    cursor.execute(sold_query)
    update_query = f"""
update products set status = TRUE where product_id = {data.pid}
"""
    cursor.execute(update_query)
    delete_query = f"""delete from notifications where from_user = {data.buyer_id} and to_user = {data.seller_id} and type = 0 and pid = {data.pid}"""
    cursor.execute(delete_query)

    find_other = f"""select from_user from notifications where to_user = {data.seller_id} and pid = {data.pid} and type = 0"""
    cursor.execute(find_other)
    results = cursor.fetchall()

    for result in results:
        buyer_id = result[0]
        insert_query = f"""insert into notifications values('{data.seller_id}', '{buyer_id}', '{time}', 2, '{data.pid}')"""
        cursor.execute(insert_query)

    delete_other = f"""delete from notifications where to_user = {data.seller_id} and pid = {data.pid} and type = 0"""
    cursor.execute(delete_other)

    conn.commit()
    conn.close()

    transactions_data = model.Transactions(
        product_id=data.pid, seller_id=data.seller_id, buyer_id=data.buyer_id
    )
    result = await transactions(transactions_data)

    return result


async def notify_reject(data: model.Notifications):
    conn, cursor = database.make_db()
    time = datetime.today().strftime("%Y-%m-%d")
    delete_query = f"""delete from notifications where from_user={data.buyer_id} and to_user = {data.seller_id} and type = 0 and pid = {data.pid}"""
    cursor.execute(delete_query)
    query = f"""INSERT INTO notifications VALUES ('{data.seller_id}', '{data.buyer_id}', '{time}', 2, {data.pid})"""
    cursor.execute(query)
    conn.commit()
    conn.close()


# async def notify_message(data:model.Notifications):
#     conn, cursor = database.make_db()
#     time = datetime.today().strftime('%Y-%m-%d')
#     query = f"""INSERT INTO notifications VALUES ('{data.seller_id}', '{data.buyer_id}', '{time}', 4, {data.pid})"""
#     cursor.execute(query)
#     conn.commit()
#     conn.close()


async def get_notifications(user_id: int):
    # this function is to get the notifications from the user live and assist the login function
    """
    notifications will have time, from_user, to_user, type
    type = enum{REQUEST TO BUY, ACCEPTED TO SELL, REJECTED TO SELL, SOME MESSAGED YOU}
    It returns an array of objects of tuple of the order (<from_user_name>, <type_of_notification>, <time>)
    0 request to buy
    1 accepted to sell.. other person will get so and so seller sold the product to you
    2 rejected to sell
    3 sold the product.. you will get so and so buyer bought the product
    """
    query = f"""
select from_name, from_id, type, time, pid, product_title from 
(select u.name as from_name, n.from_user as from_id, n.time as time, n.pid as pid, n.type as type, 
    n.to_user as to_user, p.title as product_title 
    from notifications as n 
    inner join users as u on u.user_id = n.from_user
    inner join products as p on p.product_id = n.pid ) as sub
where to_user = {user_id}
"""
    print(query)
    # query = f"""
    # SELECT u.name AS from_name, n.from_user AS from_id, n.time AS time, n.pid AS pid, n.type AS type,
    #        n.to_user AS to_user, p.title AS product_title
    # FROM notifications AS n
    # INNER JOIN users AS u ON u.user_id = n.from_user
    # INNER JOIN products AS p ON p.product_id = n.pid
    # WHERE to_user = {user_id}
    # """
    conn, cursor = database.make_db()
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    fulldata = []
    for result in results:
        data = {
            "from_name": result[0],
            "from_id": result[1],
            "type": result[2],
            "time": result[3],
            "pid": result[4],
            "product_title": result[5],
        }

        fulldata.append(data)
    # print(fulldata)
    return fulldata


async def login(user_id: int, password: str):
    conn, cursor = database.make_db()
    try:
        # 1. Check for Ban Reports
        cursor.execute(
            "SELECT COUNT(*) FROM reports WHERE reported_id = %s", (user_id,)
        )
        if cursor.fetchone()[0] >= 7:
            raise HTTPException(
                status_code=403, detail="User access restricted due to reports"
            )

        # 2. Get User Data + Hashed Password
        # We explicitly select the hashed_password to compare it
        cursor.execute(
            "SELECT verified, hashed_password FROM users WHERE user_id = %s", (user_id,)
        )
        result = cursor.fetchone()

        if result:
            verified, stored_hash = result

            if not verified:
                raise HTTPException(status_code=403, detail="User is not verified")

            # 3. Verify Password (The Critical Step)
            # Compare the Input Password (bytes) vs Stored Hash (bytes)
            if not bcrypt.checkpw(
                password.encode("utf-8"), stored_hash.encode("utf-8")
            ):
                raise HTTPException(status_code=401, detail="Incorrect password")

            # 4. Fetch Info & Return Success
            empty_data = {}
            user_info = await get_user_info(user_id)
            user_notifications = await get_notifications(user_id)

            data = {
                **empty_data,
                **user_info,
                "notifications": user_notifications,
                "message": "success",
            }
            return data

        else:
            raise HTTPException(status_code=404, detail="User not found")

    finally:
        conn.close()


async def products(file: UploadFile = File(...), data: str = Form(...)):
    conn, cursor = database.make_db()
    try:
        # Generate Product ID
        cursor.execute("SELECT MAX(product_id) FROM products")
        result = cursor.fetchone()
        if result and result[0]:
            product_id = int(result[0]) + 1
        else:
            product_id = 100000

        got = json.loads(data)

        # Read File Bytes
        image_bytes = await file.read()

        # Insert Product Details
        query = """INSERT INTO products (product_id, seller_id, sell_price, cost_price, title, 
                   nf_interests, usage, description, tags, status) 
                   VALUES (%s, %s, %s, %s, %s, 0, %s, %s, %s, FALSE)"""

        cursor.execute(
            query,
            (
                product_id,
                got["seller_id"],
                got["sell_price"],
                got["cost_price"],
                got["title"],
                got["usage"],
                got["description"],
                got["tags"],
            ),
        )

        # Insert Image Directly
        cursor.execute(
            "INSERT INTO product_images (product_id, image) VALUES (%s, %s)",
            (product_id, image_bytes),
        )

        conn.commit()
        return {"pid": product_id}
    finally:
        conn.close()


async def update_interests(product_id: int):
    conn, cursor = database.make_db()
    query = f"""UPDATE products SET nf_interests = (SELECT COUNT(*) FROM wishlist WHERE wishlist.product_id = '{product_id}') WHERE product_id = '{product_id}'"""
    cursor.execute(query)
    conn.commit()
    conn.close()


async def add_wishlist(data: model.Wishlist):
    conn, cursor = database.make_db()
    print(data)
    try:
        product_existing = f"SELECT * FROM wishlist WHERE product_id = '{data.product_id}' AND buyer_id = '{data.buyer_id}'"
        cursor.execute(product_existing)
        existing_result = cursor.fetchall()

        if existing_result:
            print("Product already exists")
            raise HTTPException(status_code=400, detail="Product already exists")
            return None

        else:
            print(existing_result)
            query = (
                f"SELECT seller_id FROM products WHERE product_id = '{data.product_id}'"
            )
            cursor.execute(query)
            result = cursor.fetchone()

            if result:
                seller_id = result[0]
                if seller_id == data.buyer_id:
                    print("You cannot add your own product to your wishlist")
                    raise HTTPException(
                        status_code=400,
                        detail="You cannot add your own product to your wishlist",
                    )
                    return None
                else:
                    insert_query = f"insert into wishlist values('{data.product_id}', '{seller_id}', '{data.buyer_id}')"
                    cursor.execute(insert_query)
                    conn.commit()

                    await update_interests(data.product_id)

                    return data

            else:
                raise HTTPException(status_code=404, detail="Product not found")

    # except Exception as e:
    #     # conn.rollback()
    #     print("Jere is the error")
    # raise HTTPException(status_code=500, detail= "Internal server error. Please try again later")
    finally:
        conn.close()


async def remove_wishlist(data: model.Wishlist):
    conn, cursor = database.make_db()
    query = f"""delete from wishlist where buyer_id = {data.buyer_id} and product_id = {data.product_id}"""
    cursor.execute(query)
    conn.commit()
    await update_interests(data.product_id)
    conn.close()


async def get_wishlist(user_id: int):
    conn, cursor = database.make_db()
    query = f"""SELECT products.product_id, products.seller_id, products.sell_price, products.cost_price, 
                products.title, products.usage, products.description, users.name FROM 
                (select * from wishlist where buyer_id = {user_id}) 
                as w inner join products on w.product_id = products.product_id
                inner join users on products.seller_id = users.user_id
                where products.status != true"""
    cursor.execute(query)
    results = cursor.fetchall()
    return_value = []
    for result in results:
        data = {
            "product_id": result[0],
            "seller_id": result[1],
            "sell_price": result[2],
            "cost_price": result[3],
            "title": result[4],
            "usage": result[5],
            "description": result[6],
            "name": result[7],
        }
        return_value.append(data)
    return return_value


async def transactions(data: model.Transactions):
    conn, cursor = database.make_db()
    try:
        query = f"SELECT sell_price, title, description FROM products WHERE product_id = '{data.product_id}'"
        cursor.execute(query)
        product_data = cursor.fetchone()
        if product_data:
            sell_price, title, description = product_data
            insert_query = f"INSERT INTO transactions (product_id, seller_id, buyer_id, cost, title, description) VALUES (%s, %s, %s, %s, %s, %s)"
            cursor.execute(
                insert_query,
                (
                    data.product_id,
                    data.seller_id,
                    data.buyer_id,
                    sell_price,
                    title,
                    description,
                ),
            )
            conn.commit()
            return data
        else:
            raise HTTPException(status_code=404, detail="Product not found")

    except Exception as e:
        # Error in loading transcation
        conn.rollback()
        raise HTTPException(
            status_code=500, detail="Internal server error. PLease try again later"
        )
    finally:
        conn.close()


async def get_transactions(user_id: int):
    conn, cursor = database.make_db()
    # sold_query = f"""SELECT buyer_id, cost, title, description FROM transactions WHERE seller_id = {user_id}"""
    sold_query = f"""
    SELECT t.buyer_id, t.cost, t.title, t.description, u.name
    FROM transactions AS t
    JOIN users AS u ON t.buyer_id = u.user_id
    WHERE t.seller_id = {user_id}
    """
    cursor.execute(sold_query)
    sold_results = cursor.fetchall()
    return_value = {"sold_results": [], "bought_results": []}
    for result in sold_results:
        data = {
            "buyer_id": result[0],
            "cost": result[1],
            "title": result[2],
            "description": result[3],
            "name": result[4],
        }
        return_value["sold_results"].append(data)
    # bought_query = f"""SELECT seller_id, cost, title, description FROM transactions WHERE buyer_id = {user_id}"""
    bought_query = f"""
    SELECT t.seller_id, t.cost, t.title, t.description, u.name
    FROM transactions AS t
    JOIN users AS u ON t.seller_id = u.user_id
    WHERE t.buyer_id = {user_id}
    """
    cursor.execute(bought_query)
    bought_results = cursor.fetchall()
    for result in bought_results:
        data = {
            "seller_id": result[0],
            "cost": result[1],
            "title": result[2],
            "description": result[3],
            "name": result[4],
        }
        return_value["bought_results"].append(data)
    return return_value


async def search(data: model.Search):
    conn, cursor = database.make_db()
    try:
        words = data.query.split()
        # Start with base query
        sql = """
            SELECT p.product_id, p.title, p.sell_price, u.name, u.email, i.image
            FROM products p
            LEFT JOIN product_images i ON p.product_id = i.product_id
            JOIN users u ON p.seller_id = u.user_id
            WHERE p.status = FALSE AND (
        """

        # Dynamically build OR conditions
        conditions = []
        params = []
        for word in words:
            conditions.append("(p.title ILIKE %s OR p.description ILIKE %s)")
            params.extend([f"%{word}%", f"%{word}%"])

        sql += " OR ".join(conditions) + ")"

        cursor.execute(sql, tuple(params))
        results = cursor.fetchall()

        final_list = []
        seen_ids = set()

        for row in results:
            pid, title, price, s_name, s_email, img_bytes = row

            if pid in seen_ids:
                continue
            seen_ids.add(pid)

            img_str = None
            if img_bytes:
                img_str = base64.b64encode(img_bytes).decode("utf-8")

            final_list.append(
                {
                    "product_id": pid,
                    "product_title": title,
                    "sell_price": price,
                    "seller_name": s_name,
                    "seller_email": s_email,
                    "product_image": img_str,
                }
            )

        return final_list
    finally:
        conn.close()


# async def edit_profile(data: model.EditProfile):
#     conn, cursor = database.make_db()
#     user_id = data.user_id
#     files = []
#     files.append(data.photo)
#     try:
#         for file in files:
#             curr_dir = os.getcwd()
#             await file.save(f"{curr_dir}/stuff/file_buffer/{file.filename}")
#             print("File added")
#             file_path = f"{curr_dir}/stuff/file_buffer/{file.filename}"
#             query = f"""UPDATE users SET photo = pg_read_binary_file('{file_path}')::bytea where user_id = {user_id}"""
#             cursor.execute(query)
#             os.remove(file_path)
#             print("File removed")
#         conn.commit()
#     except Exception as e:
#         print(f"Could not upload file")
#         print(e)
#     name_query = f"""UPDATE users SET name = {data.name} where user_id = {user_id}"""
#     cursor.execute(name_query)
#     conn.commit()
#     conn.close()


async def edit_profile(file: UploadFile = File(...), data: str = Form(...)):
    conn, cursor = database.make_db()
    try:
        got = json.loads(data)

        # Step 1: Read the file bytes directly into memory
        image_bytes = await file.read()

        # Step 2: Update Name
        cursor.execute(
            "UPDATE users SET name = %s WHERE user_id = %s",
            (got["name"], got["user_id"]),
        )

        # Step 3: Update Image (Direct Binary Insert)
        # We pass the bytes directly to the query. No temp files needed.
        cursor.execute(
            "UPDATE user_images SET pic = %s WHERE user_id = %s",
            (image_bytes, got["user_id"]),
        )

        conn.commit()
        return {"message": "Profile updated successfully"}
    finally:
        conn.close()


async def edit_name(data: model.EditProfile):
    conn, cursor = database.make_db()
    update_query = (
        f"""update users set name = '{data.name}' where user_id = {data.user_id}"""
    )
    cursor.execute(update_query)
    conn.commit()
    conn.close()


async def edit_products(file: UploadFile = File(...), data: str = Form(...)):
    conn, cursor = database.make_db()
    try:
        got = json.loads(data)

        # Read File Bytes
        image_bytes = await file.read()

        # Update Product Details
        update_query = """UPDATE products SET 
                          sell_price = %s, 
                          cost_price = %s, 
                          title = %s, 
                          usage = %s,
                          description = %s,
                          tags = %s
                          WHERE product_id = %s"""

        cursor.execute(
            update_query,
            (
                got["sell_price"],
                got["cost_price"],
                got["title"],
                got["usage"],
                got["description"],
                got["tags"],
                got["product_id"],
            ),
        )

        # Update Image Directly
        cursor.execute(
            "UPDATE product_images SET image = %s WHERE product_id = %s",
            (image_bytes, got["product_id"]),
        )

        conn.commit()
        return {"message": "Product updated successfully"}
    finally:
        conn.close()


async def edit_product_details(data: model.Product):
    conn, cursor = database.make_db()
    update_query = f"""update products set 
                    sell_price = '{data.sell_price}',
                    cost_price = '{data.cost_price}', 
                    title = '{data.title}', 
                    usage = '{data.usage}',
                    description = '{data.description}',
                    tage = '{data.tags}'
                    where product_id = '{data.product_id}'"""
    cursor.execute(update_query)
    conn.commit()
    conn.close()


async def report_user(data: model.Report):
    conn, cursor = database.make_db()
    query = f"SELECT seller_id FROM products WHERE product_id = {data.product_id}"
    cursor.execute(query)
    result = cursor.fetchone()
    if result:
        reported_id = result[0]
    if data.reporter_id == reported_id:
        print("You can't report yourself")
        raise HTTPException(
            status_code=400, detail="Reporter and reported user cannot be the same"
        )
    else:
        cursor.execute(
            "SELECT COUNT(*) FROM reports WHERE reporter_id = %s AND reported_id = %s",
            (data.reporter_id, reported_id),
        )
        if cursor.fetchone()[0] > 0:
            print("User has already been reported")
            raise HTTPException(
                status_code=400,
                detail="User has already been reported by this reporter",
            )
        else:
            cursor.execute(
                "INSERT INTO reports (reporter_id, reported_id) VALUES (%s, %s)",
                (data.reporter_id, reported_id),
            )
            conn.commit()

            return {"message": "User reported successfully"}


async def view_profile(user_id: int):
    conn, cursor = database.make_db()
    try:
        # Get basic info and image bytes in one query
        query = """
            SELECT u.name, u.email, ui.pic
            FROM users u
            LEFT JOIN user_images ui ON u.user_id = ui.user_id
            WHERE u.user_id = %s
        """
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()

        if result:
            name, email, image_bytes = result

            # Convert bytes directly to Base64 string
            pic_str = None
            if image_bytes:
                pic_str = base64.b64encode(image_bytes).decode("utf-8")

            return {"name": name, "email": email, "pic": pic_str}
        return None
    finally:
        conn.close()


async def get_products():
    conn, cursor = database.make_db()
    try:
        query = """
            SELECT p.product_id, p.title, p.sell_price, u.name, u.email, i.image
            FROM products p
            JOIN users u ON p.seller_id = u.user_id
            LEFT JOIN product_images i ON p.product_id = i.product_id
            WHERE p.status = FALSE 
            AND u.user_id NOT IN (
                SELECT reported_id FROM reports GROUP BY reported_id HAVING COUNT(*) >= 7
            )
        """
        cursor.execute(query)
        results = cursor.fetchall()

        products = []
        if results:
            for row in results:
                pid, title, price, s_name, s_email, img_bytes = row

                img_str = None
                if img_bytes:
                    img_str = base64.b64encode(img_bytes).decode("utf-8")

                products.append(
                    {
                        "product_id": pid,
                        "product_title": title,
                        "sell_price": price,
                        "seller_name": s_name,
                        "seller_email": s_email,
                        "product_image": img_str,
                    }
                )
        return products
    finally:
        conn.close()


async def get_specific_product(product_id: int):
    conn, cursor = database.make_db()
    try:
        query = """
            SELECT p.seller_id, p.sell_price, p.cost_price, p.title, p.usage, p.description,
                   u.name, u.email, i.image
            FROM products p
            JOIN users u ON p.seller_id = u.user_id
            LEFT JOIN product_images i ON p.product_id = i.product_id
            WHERE p.product_id = %s
        """
        cursor.execute(query, (product_id,))
        result = cursor.fetchone()

        if result:
            sid, sell, cost, title, usage, desc, s_name, s_email, img_bytes = result

            img_str = None
            if img_bytes:
                img_str = base64.b64encode(img_bytes).decode("utf-8")

            return {
                "seller_id": sid,
                "sell_price": sell,
                "cost_price": cost,
                "title": title,
                "usage": usage,
                "description": desc,
                "seller_name": s_name,
                "seller_email": s_email,
                "product_image": img_str,
            }
        return None
    finally:
        conn.close()


async def products_on_sale(user_id: int):
    conn, cursor = database.make_db()
    query = f"""SELECT product_id, sell_price, cost_price, title, nf_interests, usage, description, tags FROM products WHERE seller_id = {user_id} and status = FALSE"""
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    if results:
        products = []
        for row in results:
            product = {
                "product_id": row[0],
                "sell_price": row[1],
                "cost_price": row[2],
                "title": row[3],
                "nf_interests": row[4],
                "usage": row[5],
                "description": row[6],
                "tags": row[7],
            }
            products.append(product)
        return products
    else:
        return []


async def remove_product(product_id: int):
    conn, cursor = database.make_db()
    delete_query = f"""delete from products where product_id = {product_id}"""
    cursor.execute(delete_query)
    photo_query = f"""delete from product_images where product_id = {product_id}"""
    cursor.execute(photo_query)
    conn.commit()
    conn.close()


# just checking
# async def fun(data:model.Product):
#     conn, cursor = database.make_db()
#     cursor.execute("SELECT MAX(product_id) FROM fun")
#     result = cursor.fetchone()
#     if result and result[0]:
#         product_id = int(result[0]) + 1
#     else:
#         product_id = 100000


#     concat = data.title.replace(" ", "").lower() + data.description.replace(" ", "").lower()

#     query = f"""insert into fun values ('{product_id}', '{concat}')"""
#     cursor.execute(query)

#     conn.commit()
#     conn.close()
#     return data
