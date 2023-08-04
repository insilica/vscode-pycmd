import ast
import sys

code = sys.argv[1]

try:
    ast.parse(code)
    print("Valid")
except SyntaxError:
    print("Invalid")
