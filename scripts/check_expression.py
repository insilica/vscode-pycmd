import ast
import sys

def num_expressions(code: str) -> int:
    try:
        module = ast.parse(code)
        return len(module.body)
    except SyntaxError as e:
        return 0

if __name__ == "__main__":
    code = ""
    while True:
        line = sys.stdin.readline()
        if line == "END\n":
            print(num_expressions(code))
            sys.stdout.flush()
            code = ""  # Reset the code for the next block
        else:
            code += line
