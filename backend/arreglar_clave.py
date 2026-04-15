import sqlite3

# Nos conectamos a tu archivo de base de datos local
conexion = sqlite3.connect('mediclinic.db')
cursor = conexion.cursor()

# El hash correcto para la contraseña "123456"
nuevo_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s5WrTHotdJSBe"
email_admin = "admin@clinic.com"

try:
    # Intentamos primero con la tabla en plural ("users")
    cursor.execute("UPDATE users SET hashed_password = ? WHERE email = ?", (nuevo_hash, email_admin))
    conexion.commit()
    
    if cursor.rowcount > 0:
        print("✅ ¡Éxito! Contraseña actualizada en la tabla 'users'.")
    else:
        # Si no afectó a ninguna fila, probamos con singular ("user")
        cursor.execute("UPDATE user SET hashed_password = ? WHERE email = ?", (nuevo_hash, email_admin))
        conexion.commit()
        
        if cursor.rowcount > 0:
            print(" ¡Éxito! Contraseña actualizada en la tabla 'user'.")
        else:
            print(" No se encontró el usuario admin@clinic.com en la base de datos.")

except sqlite3.Error as error:
    print("Ocurrió un error al intentar actualizar:", error)
finally:
    conexion.close()