// 定义 InputCore
class InputCore<T> {
  private _value: T;

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  // 设置值
  input(value: T): void {
    this._value = value;
  }

  // 获取值
  getValue(): T {
    return this._value;
  }
}

// 定义 FieldCore
class FieldCore<T> {
  name: string;
  value: InputCore<T>;

  constructor(name: string, value: InputCore<T>) {
    this.name = name;
    this.value = value;
  }
}

// 定义 ObjectValueCore
class ObjectValueCore<T extends Record<string, any>> {
  private _fields: {
    [K in keyof T]: FieldCore<T[K]>;
  };

  constructor(fields: { [K in keyof T]: FieldCore<T[K]> }) {
    this._fields = fields;
  }

  // 获取字段
  get fields(): { [K in keyof T]: FieldCore<T[K]> } {
    return this._fields;
  }

  // 获取当前值
  get value(): T {
    const result = {} as T;
    for (const key in this._fields) {
      if (this._fields.hasOwnProperty(key)) {
        result[key] = this._fields[key].value.getValue();
      }
    }
    return result;
  }
}

// 示例使用
const $values = new ObjectValueCore({
  name: new FieldCore("name1", new InputCore<string>("")), // 初始值为空字符串
  age: new FieldCore("age1", new InputCore<number>(0)), // 初始值为 0
});

// 设置值
// $values.fields.name.value.input("jony");
// $values.fields.age.value.input(25);
$values.fields.name.value.input("");

console.log($values.value.name);
