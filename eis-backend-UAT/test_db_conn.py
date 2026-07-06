import psycopg2

try:
    conn = psycopg2.connect(host='127.0.0.1', port=5432, user='postgres', password='')
    conn.autocommit = True
    with conn.cursor() as cursor:
        # Check if user exists
        cursor.execute("SELECT 1 FROM pg_roles WHERE rolname='eis_jdms_user';")
        user_exists = cursor.fetchone()
        
        if not user_exists:
            print("Creating user 'eis_jdms_user'...")
            cursor.execute("CREATE USER eis_jdms_user WITH PASSWORD 'localpassword123';")
            print("User 'eis_jdms_user' created successfully.")
        else:
            print("User 'eis_jdms_user' already exists. Updating password...")
            cursor.execute("ALTER USER eis_jdms_user WITH PASSWORD 'localpassword123';")
            print("Password updated successfully.")
            
        # Grant permissions
        print("Granting privileges on database 'eis_jdms_db' to 'eis_jdms_user'...")
        cursor.execute("GRANT ALL PRIVILEGES ON DATABASE eis_jdms_db TO eis_jdms_user;")
        cursor.execute("ALTER DATABASE eis_jdms_db OWNER TO eis_jdms_user;")
        print("Privileges and ownership granted successfully.")
        
    conn.close()
    print("Database setup complete.")
except Exception as e:
    print(f"Error setting up database: {e}")
