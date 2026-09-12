class Calculator:
    def add(self, a, b):
        return a + b

    def sub(self, a, b):
        return a - b

    def multiply(self, a, b):
        return a * b

    def divide(self, a, b):
        if b == 0:
            return "it is not divisible by zero"
        return a / b

    def run(self):
        while True:
            try:
                user_input = input("enter number a (or 'q' to quit): ").strip()
                if user_input.lower() in ('q', 'quit', 'exit'):
                    break
                a = float(user_input)

                operation = input("+,-,*,/ (or 'q' to quit): ").strip()
                if operation.lower() in ('q', 'quit', 'exit'):
                    break

                b = float(input("enter number b: ").strip())

                if operation == "+":
                    result = self.add(a, b)
                elif operation == "-":
                    result = self.sub(a, b)
                elif operation == "*":
                    result = self.multiply(a, b)
                elif operation == "/":
                    result = self.divide(a, b)
                else:
                    print("error")
                    continue

                print("result:", result)
            except ValueError:
                print("error: invalid number")
            except (KeyboardInterrupt, EOFError):
                break


calculator = Calculator

if __name__ == "__main__":
    calc = Calculator()
    calc.run()