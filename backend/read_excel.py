import pandas as pd
import json

file_path = "/Users/emersonespinoza/Developer/proyectos/proyecto_restaurante/backend_restaurant/backups/cuadratura  inicio mes.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print("Sheets:", xl.sheet_names)
    
    # Try to find a sheet with 'cuadratura' in the name
    target_sheet = next((s for s in xl.sheet_names if 'cuadratura' in s.lower()), None)
    
    if target_sheet:
        df = pd.read_excel(file_path, sheet_name=target_sheet)
        print(f"\n--- Sheet: {target_sheet} ---")
        # Print first 50 rows to understand the structure
        print(df.head(50).to_string())
    else:
        print("No sheet named 'cuadratura' found.")
        
except Exception as e:
    print(f"Error reading Excel file: {e}")
