import ast
import sys

code = sys.argv[1]

try:
    module = ast.parse(code)
    print(len(module.body))
except SyntaxError:
    print("0")
