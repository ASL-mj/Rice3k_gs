import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PaperClipOutlined, 
  SendOutlined, 
  ExpandOutlined, 
  CompressOutlined, 
  FileImageOutlined, 
  FileTextOutlined, 
  CopyOutlined, 
  EditOutlined, 
  ReloadOutlined, 
  EllipsisOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FileMarkdownOutlined
} from '@ant-design/icons';
import { Popover, message } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import CodeBlock from '../components/CodeBlock';
import styles from '../styles/ChatPage.module.css';
import assistant from '@/assets/images/logo.png';
import user from '@/assets/images/LogoTop.png';

// 模拟的历史对话数据
// 模拟的历史对话数据
const MOCK_DIALOGUES = {
  '1': [
    {
      id: 1,
      type: 'user',
      content: '如何优化React应用性能？我的应用加载速度很慢。',
      timestamp: new Date('2024-01-15T10:30:00'),
    },
    {
      id: 2,
      type: 'assistant',
      content: '优化React应用性能可以从以下几个方面入手：\n\n1. **使用React.memo和useMemo**：避免不必要的组件重渲染\n2. **代码分割**：使用React.lazy和Suspense进行懒加载\n3. **虚拟化长列表**：使用react-window或react-virtualized\n4. **优化图片**：使用WebP格式，实现懒加载\n5. **减少bundle大小**：tree shaking，移除未使用的依赖\n\n你的应用主要是哪方面慢？首屏加载还是交互响应？',
      timestamp: new Date('2024-01-15T10:30:15'),
    },
    {
      id: 3,
      type: 'user',
      content: '主要是首屏加载慢，大概需要5秒才能看到内容。',
      timestamp: new Date('2024-01-15T10:31:00'),
    },
    {
      id: 4,
      type: 'assistant',
      content: '首屏加载慢的话，建议优先做这些优化：\n\n1. **代码分割**：将路由组件改为懒加载\n```javascript\nconst Home = lazy(() => import(\'./pages/Home\'));\n```\n\n2. **优化打包配置**：\n- 启用生产模式构建\n- 使用compression-webpack-plugin压缩资源\n- 配置CDN加速静态资源\n\n3. **首屏关键资源优化**：\n- 内联关键CSS\n- 预加载关键字体\n- 使用骨架屏提升感知性能\n\n建议先用Chrome DevTools的Lighthouse分析一下，看看具体瓶颈在哪里。',
      timestamp: new Date('2024-01-15T10:31:30'),
    },
    {
      id: 5,
      type: 'user',
      content: '好的，我试试。另外，我看到我的列表组件在滚动时很卡，列表大概有几千条数据。',
      timestamp: new Date('2024-01-15T10:32:15'),
    },
    {
      id: 6,
      type: 'assistant',
      content: '明白了，这就是典型的长列表性能问题。渲染几千个DOM节点会严重阻塞主线程。你需要使用“虚拟化”技术，只渲染当前屏幕可见的那一小部分列表项。可以尝试使用`react-window`库，它非常高效。\n\n```jsx\nimport { FixedSizeList as List } from \'react-window\';\n\nconst Row = ({ index, style, data }) => (\n  <div style={style}>Item {data[index]}</div>\n);\n\nconst VirtualizedList = ({ items }) => (\n  <List\n    height={600} // 容器高度\n    itemCount={items.length}\n    itemSize={50} // 每一项的高度\n    itemData={items} // 传递数据\n  >\n    {Row}\n  </List>\n);\n```\n这样无论列表有多长，都只会渲染几十个DOM节点，性能会大幅提升。',
      timestamp: new Date('2024-01-15T10:33:00'),
    },
    {
      id: 7,
      type: 'user',
      content: '太好了，这个`react-window`听起来很有用。那如果我的数据是在不断更新的，比如实时股票价格那种，我还需要注意什么吗？',
      timestamp: new Date('2024-01-15T10:34:20'),
    },
    {
      id: 8,
      type: 'assistant',
      content: '对于高频更新的场景，除了虚拟化，你还需要特别注意几个点：\n\n1.  **使用`useCallback`和`useMemo`**：确保传递给列表项的函数和对象引用是稳定的，防止不必要的重渲染。\n\n2.  **优化状态更新**：如果每秒更新成百上千次，频繁调用`setState`本身就会成为性能瓶颈。可以考虑使用`useReducer`配合批量更新，或者使用`requestAnimationFrame`来节流更新频率，将多次更新合并到一个动画帧中处理。\n\n3.  **Diff策略**：如果数据更新是通过替换整个数组实现的，确保新旧数组中的对象具有相同的引用（如果数据本身没变），或者使用一个唯一的ID来帮助React的Diff算法快速定位变化。`react-window`的`itemKey` prop 就是用来优化这个的。',
      timestamp: new Date('2024-01-15T10:35:45'),
    },
    {
      id: 9,
      type: 'user',
      content: '还有一个问题，我发现每次父组件状态更新，我的子组件不管有没有用到这个状态，都会重新渲染，这很烦人。',
      timestamp: new Date('2024-01-15T10:36:10'),
    },
    {
      id: 10,
      type: 'assistant',
      content: '这是一个非常常见的性能问题，根本原因就是不必要的重渲染。React的更新机制是“向下”的，父组件一旦更新，其所有子组件默认都会跟着重渲染，除非你显式地阻止它。\n\n解决方案主要有两个：\n\n1.  **`React.memo`**: 这是给函数组件用的。它会浅比较组件的props，如果props没变，就不会重渲染。`const MyComponent = React.memo(MyComponent)`。\n\n2.  **`PureComponent`**: 这是给类组件用的，效果和`React.memo`类似，会浅比较props和state。\n\n记住，浅比较只比较第一层属性，如果props是个深层嵌套的对象，哪怕只是改变了最深层的一个值，浅比较也可能认为对象没有变化，导致UI更新不及时。所以，配合`useMemo`等Hook来保证传递给子组件的复杂对象引用稳定，是非常重要的。',
      timestamp: new Date('2024-01-15T10:37:30'),
    }
  ],
  '2': [
    {
      id: 1,
      type: 'user',
      content: '能解释一下JavaScript闭包的概念吗？我总是搞不清楚。',
      timestamp: new Date('2024-01-14T14:20:00'),
    },
    {
      id: 2,
      type: 'assistant',
      content: '闭包是JavaScript中一个重要的概念。简单来说，**闭包就是函数能够记住并访问它被创建时所在的词法作用域，即使函数在其词法作用域之外执行**。\n\n举个例子：\n```javascript\nfunction createCounter() {\n  let count = 0;\n  \n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n```\n\n这里内部函数可以访问外部函数的`count`变量，即使`createCounter`已经执行完毕。这就是闭包。',
      timestamp: new Date('2024-01-14T14:20:20'),
    },
    {
      id: 3,
      type: 'user',
      content: '那闭包有什么实际用途呢？',
      timestamp: new Date('2024-01-14T14:21:00'),
    },
    {
      id: 4,
      type: 'assistant',
      content: '闭包在实际开发中有很多用途：\n\n1. **数据私有化**：创建私有变量\n```javascript\nfunction createPerson(name) {\n  let _name = name; // 私有变量\n  \n  return {\n    getName: () => _name,\n    setName: (newName) => { _name = newName; }\n  };\n}\n```\n\n2. **函数工厂**：创建特定功能的函数\n```javascript\nfunction multiply(x) {\n  return function(y) {\n    return x * y;\n  };\n}\nconst double = multiply(2);\n```\n\n3. **回调和事件处理**：保持状态\n4. **模块模式**：实现模块化\n\n闭包让JavaScript更加灵活强大！',
      timestamp: new Date('2024-01-14T14:21:25'),
    },
    {
      id: 5,
      type: 'user',
      content: '哦，我好像明白了。那在for循环里定义事件处理器，为什么总说我需要用闭包来解决那个“经典问题”？',
      timestamp: new Date('2024-01-14T14:22:10'),
    },
    {
      id: 6,
      type: 'assistant',
      content: '啊，你说的就是那个经典的循环和异步问题！这确实是闭包的一个典型应用场景。问题的核心在于变量的共享和作用域。\n\n**错误示例：**\n```javascript\n// 假设有3个按钮\nfor (var i = 0; i < 3; i++) {\n  document.getElementById(\'btn-\' + i).addEventListener(\'click\', function() {\n    console.log(i); // 无论点击哪个按钮，都打印 3！\n  });\n}\n```\n\n**为什么会这样？**\n因为`var`是函数作用域，循环结束时，`i`的值变成了3。所有事件处理器函数共享同一个`i`变量。当点击事件触发时，函数去访问`i`，此时`i`已经是3了。\n\n**闭包解法（ES5时代）：**\n```javascript\nfor (var i = 0; i < 3; i++) {\n  (function(index) { // 立即执行函数 (IIFE) 创建了一个新的作用域\n    document.getElementById(\'btn-\' + index).addEventListener(\'click\', function() {\n      console.log(index); // 正确打印 0, 1, 2\n    });\n  })(i); // 将当前的 i 值传给内部函数\n}\n```\n\n**现代解法（ES6+）：**\n使用`let`关键字，因为它创建块级作用域，每次循环都会创建一个新的`i`。\n```javascript\nfor (let i = 0; i < 3; i++) { // 注意是 let\n  document.getElementById(\'btn-\' + i).addEventListener(\'click\', function() {\n    console.log(i); // 正确打印 0, 1, 2\n  });\n}\n```\n\n所以，闭包在这里“捕获”了每次循环时的`i`值，解决了共享变量带来的问题。',
      timestamp: new Date('2024-01-14T14:25:00'),
    },
    {
      id: 7,
      type: 'user',
      content: '原来如此！那除了这些问题，闭包还有什么需要特别注意的地方吗？比如性能或者内存方面？',
      timestamp: new Date('2024-01-14T14:26:05'),
    },
    {
      id: 8,
      type: 'assistant',
      content: '很好的问题！闭包虽然强大，但也确实有一些需要注意的地方，尤其是在内存管理方面。\n\n**最大的潜在问题是内存泄漏**。由于闭包会保留对其外部作用域中变量的引用，只要闭包函数存在，这些外部变量就不会被垃圾回收机制（GC）回收，即使外部函数已经执行完毕。\n\n**示例：**\n```javascript\nfunction createClosure() {\n  const largeData = new Array(1000000).fill(\'data\'); // 占用大量内存\n  \n  return function() {\n    // 这个闭包一直持有对 largeData 的引用\n    console.log(largeData.length);\n  };\n}\n\nconst closureFunc = createClosure();\n// 即使调用完 createClosure(), largeData 也不会被释放\n// 因为 closureFunc 仍然存在并需要它\n\n// 如果不再需要，必须手动解除引用\n// closureFunc = null; // 这样 largeData 才有可能被 GC 回收\n```\n\n**最佳实践：**\n1.  **只保留必要的变量**：不要在闭包中无意间捕获了巨大的对象或数组。\n2.  **及时清理**：在不需要闭包时，将其引用设置为 `null`，主动断开与外部变量的连接，让垃圾回收器可以正常工作。\n\n总的来说，闭包的“记忆性”既是优点也是需要谨慎对待的点。',
      timestamp: new Date('2024-01-14T14:28:30'),
    },
    {
      id: 9,
      type: 'user',
      content: '学到了！那在React中，闭包是不是也容易出问题？我听说和useEffect有关。',
      timestamp: new Date('2024-01-14T14:30:00'),
    },
    {
      id: 10,
      type: 'assistant',
      content: '没错！在React中，闭包是Hooks实现的核心，但也是很多初学者容易踩坑的地方，特别是在`useEffect`中。\n\n`useEffect`中的函数会“捕获”其定义时的props和state值。如果忘记更新依赖项，就会产生“陈旧闭包”的问题。\n\n**示例：**\n```jsx\nfunction Component({ userId }) {\n  const [user, setUser] = useState(null);\n\n  useEffect(() => {\n    // 这个函数“记住”了userId的初始值\n    fetchUser(userId).then(setUser); \n    // 如果userId后来变了，这个effect不会自动重新运行\n  }, []); // 错误！userId没有在依赖数组中\n}\nfunction Component({ userId }) {\n  const [user, setUser] = useState(null);\n\n  useEffect(() => {\n    // 这个函数“记住”了userId的初始值\n    fetchUser(userId).then(setUser); \n    // 如果userId后来变了，这个effect不会自动重新运行\n  }, []); // 错误！userId没有在依赖数组中\n}\nfunction Component({ userId }) {\n  const [user, setUser] = useState(null);\n\n  useEffect(() => {\n    // 这个函数“记住”了userId的初始值\n    fetchUser(userId).then(setUser); \n    // 如果userId后来变了，这个effect不会自动重新运行\n  }, []); // 错误！userId没有在依赖数组中\n}\nfunction Component({ userId }) {\n  const [user, setUser] = useState(null);\n\n  useEffect(() => {\n    // 这个函数“记住”了userId的初始值\n    fetchUser(userId).then(setUser); \n    // 如果userId后来变了，这个effect不会自动重新运行\n  }, []); // 错误！userId没有在依赖数组中\n}\nfunction Component({ userId }) {\n  const [user, setUser] = useState(null);\n\n  useEffect(() => {\n    // 这个函数“记住”了userId的初始值\n    fetchUser(userId).then(setUser); \n    // 如果userId后来变了，这个effect不会自动重新运行\n  }, []); // 错误！userId没有在依赖数组中\n}\n```\n\n**正确的做法是：**\n```jsx\nuseEffect(() => {\n  fetchUser(userId).then(setUser); \n}, [userId]); // 正确！将userId加入依赖数组\n```\n\nReact的`eslint-plugin-react-hooks`插件会强制你遵守依赖规则，就是为了帮你避免这类由闭包引起的bug。记住，组件的每一次渲染都会生成一个新的闭包环境。',
      timestamp: new Date('2024-01-14T14:32:15'),
    }
  ],
  '3': [
    {
      id: 1,
      type: 'user',
      content: '数据库索引应该怎么设计？有什么最佳实践吗？',
      timestamp: new Date('2024-01-13T16:00:00'),
    },
    {
      id: 2,
      type: 'assistant',
      content: '数据库索引设计的最佳实践：\n\n**1. 选择合适的列建立索引**\n- WHERE子句中频繁使用的列\n- JOIN操作的关联列\n- ORDER BY和GROUP BY的列\n\n**2. 复合索引的顺序**\n- 遵循"最左前缀"原则\n- 选择性高的列放在前面\n\n**3. 避免过度索引**\n- 索引会占用存储空间\n- 影响INSERT/UPDATE/DELETE性能\n\n**4. 使用覆盖索引**\n- 索引包含查询所需的所有列\n- 避免回表查询\n\n你是用MySQL还是PostgreSQL？',
      timestamp: new Date('2024-01-13T16:00:25'),
    },
    {
      id: 3,
      type: 'user',
      content: '我用的是MySQL。你提到的“最左前缀”原则我不太明白，能详细解释一下吗？',
      timestamp: new Date('2024-01-13T16:02:00'),
    },
    {
      id: 4,
      type: 'assistant',
      content: '好的，MySQL的B+树复合索引的“最左前缀”原则非常重要。\n\n假设你创建了一个复合索引 `(user_id, status, create_time)`。那么这个索引的生效规则如下：\n\n**有效的查询** (能用到索引):\n- `WHERE user_id = ?` (只用第一个)\n- `WHERE user_id = ? AND status = ?` (用前两个)\n- `WHERE user_id = ? AND status = ? AND create_time = ?` (用全部三个)\n- `WHERE user_id = ? AND create_time = ?` (用第一个，第二个缺失，第三个`create_time`无法使用索引排序，但仍可能被优化器利用)\n\n**无效的查询** (不能用到索引):\n- `WHERE status = ?` (没用第一个)\n- `WHERE create_time = ?` (没用第一个)\n- `WHERE status = ? AND create_time = ?` (没用第一个)\n\n简单来说，查询条件必须包含索引最左边的那个字段，才能有效地利用该索引。你可以把它想象成一个电话簿，先按姓氏（最左），再按名字排序。',
      timestamp: new Date('2024-01-13T16:04:10'),
    },
    {
      id: 5,
      type: 'user',
      content: '明白了！那什么是“覆盖索引”，为什么说它可以避免回表？',
      timestamp: new Date('2024-01-13T16:05:30'),
    },
    {
      id: 6,
      type: 'assistant',
      content: '这是一个非常高效的概念！我们先了解一下“回表”。\n\n在MySQL的InnoDB存储引擎中：\n- **聚簇索引**（通常是主键）的叶子节点包含了完整的数据行。\n- **二级索引**（非主键索引）的叶子节点只包含索引列的值和对应的主键ID（`rowid`）。\n\n**回表现象**：当你使用二级索引进行查询时，如果查询的列不完全被索引覆盖，MySQL会先通过二级索引找到主键ID，然后再回到聚簇索引（也就是真正的数据表）中根据主键ID查找完整的行数据。这个“二次查找”的过程就是“回表”，它会增加I/O操作，降低查询速度。\n\n**覆盖索引**：如果一个索引包含了查询所需的所有列，那么MySQL就无需再进行第二次查找，直接从索引的叶子节点就能获取全部数据，这就是“覆盖索引”。\n\n**示例：**\n```sql\n-- 假设有一张订单表\nCREATE TABLE orders (\n  id INT PRIMARY KEY,\n  user_id INT,\n  status VARCHAR(20),\n  amount DECIMAL(10,2)\n);\n\n-- 创建一个复合索引\nCREATE INDEX idx_user_status ON orders (user_id, status);\n\n-- 这个查询是“覆盖索引”\nSELECT user_id, status FROM orders WHERE user_id = 123 AND status = "paid";\n-- MySQL只需在idx_user_status索引上查找即可，无需回表。\n\n-- 这个查询需要“回表”\nSELECT user_id, status, amount FROM orders WHERE user_id = 123 AND status = "paid";\n-- MySQL需要先在索引上找到user_id和status，然后拿着id回表去取amount。\n```\n\n所以，设计覆盖索引可以极大地提升查询性能。',
      timestamp: new Date('2024-01-13T16:10:00'),
    },
    {
      id: 7,
      type: 'user',
      content: '涨知识了！那我怎么知道我的查询有没有用上索引，或者用的索引好不好呢？',
      timestamp: new Date('2024-01-13T16:11:20'),
    },
    {
      id: 8,
      type: 'assistant',
      content: '这是一个关键问题，你需要使用MySQL的`EXPLAIN`命令来分析查询的执行计划。它会告诉你MySQL是如何执行你的SQL语句的。\n\n**重点关注`EXPLAIN`输出中的几个字段：**\n\n1.  **`type`**: 这是最重要的字段之一，表示连接类型。性能从好到差大致为：`system/const` > `eq_ref` > `ref` > `range` > `index` > `ALL`。`ALL`意味着全表扫描，是最坏的情况。\n2.  **`possible_keys`**: MySQL认为可以选用的索引来查找行的候选列表。\n3.  **`key`**: 实际被使用的索引。如果是`NULL`，则说明没有使用索引。\n4.  **`key_len`**: 被使用的索引的长度。越短通常越好。\n5.  **`rows`**: MySQL估算为了找到所需的行而要检查的行数。这个数字越小越好。\n6.  **`Extra`**: 包含了额外的信息，比如`Using index`表示使用了覆盖索引，`Using filesort`表示需要额外的排序操作，这些都是需要关注的点。\n\n**使用方法：**\n```sql\nEXPLAIN SELECT * FROM orders WHERE user_id = 123 AND status = "paid";\n```\n\n通过分析`EXPLAIN`的结果，你就能清楚地知道你的索引策略是否有效，并据此进行优化。',
      timestamp: new Date('2024-01-13T16:14:00'),
    },
    {
      id: 9,
      type: 'user',
      content: '太有用了！最后一个问题，什么样的列不适合建索引？',
      timestamp: new Date('2024-01-13T16:15:10'),
    },
    {
      id: 10,
      type: 'assistant',
      content: '问得很好，不是所有列都适合建索引，盲目建索引反而会适得其反。以下情况通常不适合：\n\n1.  **数据基数小的列**：比如性别（只有男/女）、开关状态（Y/N）等。这类列的区分度很低（Cardinality低），即使建了索引，查出来的数据也占总数的一大半，全表扫描可能比走索引更快，还会白白增加维护成本。\n\n2.  **很少被查询的列**：只为一个很少执行的查询建立索引，性价比太低。\n\n3.  **频繁更新的列**：索引需要随着数据的更新而动态维护（如B+树的分裂、合并），如果一个列经常被`INSERT`, `UPDATE`, `DELETE`，那么维护索引的开销会非常大，严重影响写入性能。\n\n4.  **在WHERE条件中使用了函数或表达式的列**：\n```sql\n-- 这样的查询无法使用索引（假设name上有索引）\nSELECT * FROM users WHERE UPPER(name) = "JOHN";\n-- 应该考虑在查询条件和存储数据上保持一致，或者建立函数索引（MySQL 8.0+支持）。\n```\n\n5.  **超长的文本列**：如`TEXT`, `LONGTEXT`。为长字符串建立索引会占用大量空间，且效果不佳。可以考虑对列的前缀建立索引，如 `INDEX idx_content_prefix(content(100))`。\n\n总之，建索引的核心是“读多写少，区分度高”，要权衡读写的性能成本。',
      timestamp: new Date('2024-01-13T16:18:00'),
    }
  ],
  '4': [
    {
      id: 1,
      type: 'user',
      content: 'RESTful API设计有哪些原则？',
      timestamp: new Date('2024-01-12T11:00:00'),
    },
    {
      id: 2,
      type: 'assistant',
      content: 'RESTful API设计的核心原则：\n\n**1. 使用HTTP方法**\n- GET：获取资源\n- POST：创建资源\n- PUT：更新资源（完整）\n- PATCH：更新资源（部分）\n- DELETE：删除资源\n\n**2. 资源命名**\n- 使用名词而非动词\n- 使用复数形式\n- 例如：`/users`、`/posts`\n\n**3. URL层级**\n```\nGET /users/123/posts\nGET /users/123/posts/456\n```\n\n**4. 状态码**\n- 200：成功\n- 201：创建成功\n- 400：客户端错误\n- 404：未找到\n- 500：服务器错误\n\n**5. 版本控制**\n- `/api/v1/users`\n\n需要具体的API设计示例吗？',
      timestamp: new Date('2024-01-12T11:00:30'),
    },
    {
      id: 3,
      type: 'user',
      content: '是的，能给一个电商系统，比如订单和商品这两个核心模块的具体设计示例吗？',
      timestamp: new Date('2024-01-12T11:02:00'),
    },
    {
      id: 4,
      type: 'assistant',
      content: '好的，我们以一个电商系统的商品(`products`)和订单(`orders`)为例：\n\n### 商品 (Products)\n\n- **获取所有商品**\n  - `GET /api/v1/products`\n  - Query Params: `page`, `limit`, `category`, `min_price`, `max_price`\n  - Response: `200 OK` with list of products\n\n- **获取单个商品**\n  - `GET /api/v1/products/{product_id}`\n  - Response: `200 OK` with product details\n\n- **创建商品**\n  - `POST /api/v1/products`\n  - Request Body: `{\"name\": \"iPhone\", \"price\": 999}`\n  - Response: `201 Created` with the new product\n\n- **更新商品**\n  - `PUT /api/v1/products/{product_id}` (完整替换)\n  - `PATCH /api/v1/products/{product_id}` (部分更新)\n  - Response: `200 OK` or `204 No Content`\n\n- **删除商品**\n  - `DELETE /api/v1/products/{product_id}`\n  - Response: `204 No Content`\n\n### 订单 (Orders)\n\n- **获取当前用户的订单列表**\n  - `GET /api/v1/orders`\n  - (通常需要认证，服务端从token中获取用户ID)\n  - Response: `200 OK` with list of user\'s orders\n\n- **获取单个订单详情**\n  - `GET /api/v1/orders/{order_id}`\n  - Response: `200 OK` with full order details (including items)\n\n- **创建订单**\n  - `POST /api/v1/orders`\n  - Request Body: `{\"items\": [{\"product_id\": 1, \"quantity\": 2}], \"address_id\": 1}`\n  - Response: `201 Created` with the new order object\n\n- **取消订单** (这是一个业务动作)\n  - `PUT /api/v1/orders/{order_id}/cancel` 或 `PATCH /api/v1/orders/{order_id}` (在body中传`{status: "cancelled"}`)\n  - Response: `200 OK`\n\n- **删除订单** (通常不允许，可以软删除或标记为已废弃)\n\n这种设计清晰地表达了对资源的操作，非常符合REST的理念。',
      timestamp: new Date('2024-01-12T11:08:00'),
    },
    {
      id: 5,
      type: 'user',
      content: '很清晰！那如果我想获取某个订单里包含的商品详情，URL应该怎么设计？',
      timestamp: new Date('2024-01-12T11:09:15'),
    },
    {
      id: 6,
      type: 'assistant',
      content: '这是一个很好的问题，涉及到资源的嵌套关系。对于“获取订单ID为123的订单里包含的商品详情”，有两种常见的RESTful设计方式：\n\n**方式一：嵌套资源 (Nested Resources)**\n- `GET /api/v1/orders/{order_id}/items`\n- 这种方式非常直观，明确表达了“订单123的项目”这个概念。返回的将是该订单下所有商品项的列表，通常包含商品的基本信息和购买数量等订单相关属性。\n\n**方式二：通过查询参数过滤 (Filtering)**\n- `GET /api/v1/products?order_id=123`\n- 这种方式将请求视为对`products`资源的查询，通过`order_id`参数进行过滤。这种方式在某些场景下可能更灵活，特别是当一个商品实体本身很庞大时，你可以只返回关联信息而不需要返回完整的产品详情。\n\n**推荐哪种？**\n在电商场景下，**方式一（嵌套资源）`GET /api/v1/orders/{order_id}/items`** 通常是首选。因为它语义更清晰，准确地描述了“订单项”这个概念。返回的数据结构可能如下：\n\n```json\n{\n  "items": [\n    {\n      "id": 456,\n      "product_id": 789,\n      "product_name": "iPhone 15",\n      "quantity": 1,\n      "price_at_purchase": 999.00\n    }\n  ]\n}\n```\n\n需要注意的是，`items`在这里是订单下的一个子资源集合，它可能和主`products`资源的返回格式略有不同。',
      timestamp: new Date('2024-01-12T11:12:00'),
    },
    {
      id: 7,
      type: 'user',
      content: '那API的错误处理和返回格式应该如何统一规范呢？',
      timestamp: new Date('2024-01-12T11:13:30'),
    },
    {
      id: 8,
      type: 'assistant',
      content: '统一的错误处理和返回格式对于API的可用性和可维护性至关重要。一个规范的API响应体应该包含状态、数据和错误信息。一个常见的模式如下：\n\n**成功响应 (Success Response):**\n```json\n{\n  "success": true,\n  "code": 200,\n  "message": "操作成功",\n  "data": {\n    // 实际的业务数据\n    "id": 123,\n    "name": "Product Name"\n  }\n}\n```\n\n**失败/错误响应 (Error Response):**\n```json\n{\n  "success": false,\n  "code": 404,\n  "message": "找不到指定的资源",\n  "error_code": "RESOURCE_NOT_FOUND",\n  "details": { // 可选，用于提供更详细的错误信息\n    "field": "product_id",\n    "reason": "The requested product ID does not exist."\n  }\n}\n```\n\n**关键点：**\n\n1.  **`success`**: 一个布尔值，快速区分成功与失败。\n2.  **`code`**: HTTP状态码，用于程序判断。\n3.  **`message`**: 一个人类可读的错误信息。\n4.  **`error_code`**: 一个机器可读的、标准化的错误码（如`INVALID_INPUT`, `UNAUTHORIZED`），方便客户端进行逻辑处理。\n5.  **`data`**: 成功时返回的业务数据。失败时，这个字段可以不存在或为`null`。\n\n遵循这样的格式，可以让消费API的前端或第三方开发者更容易地理解和处理API的各种响应。',
      timestamp: new Date('2024-01-12T11:16:45'),
    }
  ],
  '5': [
    {
      id: 1,
      type: 'user',
      content: '如何使用Docker进行容器化部署？',
      timestamp: new Date('2024-01-11T09:00:00'),
    },
    {
      id: 2,
      type: 'assistant',
      content: 'Docker容器化部署的基本步骤：\n\n**1. 创建Dockerfile**\n```dockerfile\nFROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]\n```\n\n**2. 构建镜像**\n```bash\ndocker build -t myapp:1.0 .\n```\n\n**3. 运行容器**\n```bash\ndocker run -d -p 3000:3000 myapp:1.0\n```\n\n**4. 使用docker-compose管理多容器**\n```yaml\nversion: \'3\'\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n  db:\n    image: postgres:14\n```\n\n你是要部署什么类型的应用？',
      timestamp: new Date('2024-01-11T09:00:35'),
    },
    {
      id: 3,
      type: 'user',
      content: '我是一个前后端分离的项目，前端是React，后端是Node.js，他们之间需要连接数据库MongoDB。用Docker Compose应该怎么组织？',
      timestamp: new Date('2024-01-11T09:05:00'),
    },
    {
      id: 4,
      type: 'assistant',
      content: '对于前后端分离的项目，`docker-compose.yml`是管理多个服务（应用、数据库等）的最佳实践。下面是一个典型的组织方式：\n\n**项目结构:**\n```\nmy-app/\n├── docker-compose.yml\n├── frontend/        # React项目根目录\n│   ├── Dockerfile\n│   └── ...\n├── backend/         # Node.js项目根目录\n│   ├── Dockerfile\n│   └── ...\n└── mongodb-data/    # 用于持久化MongoDB数据 (gitignore)\n```\n\n**`docker-compose.yml`:**\n```yaml\nversion: \'3.8\'\n\nservices:\n  # MongoDB 服务\n  mongodb:\n    image: mongo:6\n    container_name: my-mongo-db\n    restart: always # 容器异常退出后自动重启\n    environment:\n      MONGO_INITDB_ROOT_USERNAME: root\n      MONGO_INITDB_ROOT_PASSWORD: example\n    volumes:\n      # 将主机的 ./mongodb-data 目录挂载到容器的 /data/db，实现数据持久化\n      - ./mongodb-data:/data/db \n    ports:\n      # 仅在开发时映射端口到主机，生产环境通常不映射\n      - "27017:27017\"\n\n  # 后端 Node.js 服务\n  backend:\n    build:\n      context: ./backend  # 指定Dockerfile的位置\n      dockerfile: Dockerfile\n    container_name: my-backend\n    restart: always\n    depends_on:\n      # 确保mongodb服务启动后再启动backend\n      - mongodb \n    environment:\n      # 通过环境变量将数据库连接地址告诉后端应用\n      - DB_HOST=mongodb # 这里使用服务名作为host，Docker会自动解析\n      - DB_PORT=27017\n      - DB_USER=root\n      - DB_PASS=example\n    ports:\n      - "8080:8080" # 假设你的Node.js应用监听8080\n    links:\n      # (可选) 旧版本依赖，现在 networks 通常已自动处理\n      - mongodb \n\n  # 前端 React 服务\n  frontend:\n    build:\n      context: ./frontend\n      dockerfile: Dockerfile\n    container_name: my-frontend\n    restart: always\n    depends_on:\n      - backend # 确保backend启动\n    ports:\n      - "3000:80\" # 假设你用nginx镜像构建前端，它默认监听80\n    # 如果前端需要代理请求到后端，可以在这里配置\n\nnetworks:\n  default:\n    driver: bridge # 使用默认的桥接网络，服务间可通过服务名通信\n```\n\n**要点解释：**\n- **`depends_on`**: 确保服务启动顺序，但请注意它只保证容器启动，并不保证服务（如MongoDB进程）完全就绪。对于强依赖，应用内部可能还需要重试连接逻辑。\n- **`volumes`**: 至关重要！用于将数据库数据持久化到宿主机，防止容器删除后数据丢失。\n- **`environment`**: 用环境变量配置服务，比如数据库地址。在服务内部，应用会读取这些变量来连接数据库。服务名（如`mongodb`）在Docker网络内可以作为主机名使用。\n\n这样，你只需要在项目根目录运行 `docker-compose up --build` 就能一键启动整个应用栈。',
      timestamp: new Date('2024-01-11T09:20:00'),
    },
    {
      id: 5,
      type: 'user',
      content: '明白了，那Docker镜像是不是越大越好？我怎么减小我应用的镜像体积？',
      timestamp: new Date('2024-01-11T09:22:10'),
    },
    {
      id: 6,
      type: 'assistant',
      content: '绝对不是！镜像越小越好。小镜像有很多好处：\n- **更快的拉取和推送速度**：在CI/CD流水线和部署到服务器时效率更高。\n- **更少的存储空间占用**。\n- **更小的攻击面**：包含的软件包更少，潜在的安全漏洞也更少。\n\n以下是一些减小镜像体积的关键技巧：\n\n1.  **使用轻量级基础镜像**：\n    - 尽量不用 `ubuntu` 或 `centos` 这样的完整Linux发行版。对于Node.js应用，使用 `node:alpine` 是一个非常好的选择。Alpine Linux是一个极度精简的发行版。\n    ```dockerfile\n    # 不推荐\n    FROM ubuntu\n    RUN apt-get update && apt-get install -y nodejs\n    # 推荐\n    FROM node:18-alpine\n    ```\n\n2.  **多阶段构建 (Multi-stage Builds)**：\n    这是最有效的优化手段之一。你可以在一个Dockerfile中定义多个`FROM`指令，将构建环境和运行环境分开。最终的镜像只包含运行时所需的文件。\n    ```dockerfile\n    # --- 构建阶段 ---\n    FROM node:18 AS builder\n    WORKDIR /app\n    COPY package*.json ./\n    RUN npm install --production=false # 安装所有依赖，包括devDependencies\n    COPY . .\n    RUN npm run build # 执行构建命令，生成dist等产物\n\n    # --- 运行阶段 ---\n    FROM node:18-alpine AS runner\n    WORKDIR /app\n    # 只从构建阶段复制构建好的产物和生产依赖\n    COPY --from=builder /app/dist ./dist\n    COPY --from=builder /app/node_modules ./node_modules \n    # 复制package.json (如果需要在容器内执行npm start)\n    COPY --from=builder /app/package*.json ./\n    \n    EXPOSE 8080\n    CMD ["npm", "start"]\n    ```\n    这样，最终的镜像里就没有了构建工具、源代码和开发依赖，体积会显著减小。\n\n3.  **优化COPY指令**：\n    - 先复制`package*.json`文件并安装依赖，利用Docker的构建缓存。如果`package.json`没有变化，这一步就会直接使用缓存，大大提高构建速度。\n    - 使用`.dockerignore`文件，忽略不必要的文件（如`.git`, `node_modules` if copying all, logs等）被打包进镜像。\n\n4.  **清理不必要的包**：\n    在安装系统包后，记得清理包管理器的缓存。例如，在基于Debian/Ubuntu的镜像中，`RUN apt-get update && apt-get install -y ... && rm -rf /var/lib/apt/lists/*`。',
      timestamp: new Date('2024-01-11T09:35:00'),
    },
    {
      id: 7,
      type: 'user',
      content: '多阶段构建听起来很棒！那在生产环境中，我应该怎么安全地管理Docker容器和部署新版本？',
      timestamp: new Date('2024-01-11T09:37:00'),
    },
    {
      id: 8,
      type: 'assistant',
      content: '在生产环境中，安全和可靠的部署是重中之重。以下是一些核心实践：\n\n1.  **使用编排工具**：\n    - `docker-compose` 主要用于开发和简单的单机部署。在生产环境，强烈推荐使用 Kubernetes (K8s) 或 Docker Swarm 这样的容器编排平台。它们提供了负载均衡、服务发现、自动扩缩容、滚动更新、健康检查等高级功能。\n\n2.  **滚动更新 (Rolling Update)**：\n    这是部署新版本的标准方式，可以实现零停机。编排工具（如K8s的Deployment）会逐步停止旧版本的容器实例，并启动新版本的实例，直到所有实例都被替换。\n\n3.  **健康检查 (Health Checks)**：\n    在Dockerfile或`docker-compose.yml`中定义健康检查命令。这能让编排工具知道你的应用是否真正启动并准备好接收流量，从而安全地进行更新。\n    ```dockerfile\n    HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\\n    CMD curl -f http://localhost:8080/health || exit 1\n    ```\n\n4.  **使用专用用户运行容器**：\n    默认情况下，容器内的进程可能以`root`身份运行，这存在安全风险。应在Dockerfile中创建一个非root用户，并使用该用户运行应用。\n    ```dockerfile\n    RUN addgroup -g 1001 -S nodejs\n    RUN adduser -S nextjs -u 1001\n    USER nextjs\n    ```\n\n5.  **凭证管理**：\n    绝对不要将密码、密钥等敏感信息硬编码在Dockerfile或`docker-compose.yml`中。应使用编排平台提供的Secrets管理功能（如K8s Secrets, Docker Swarm Secrets）或环境变量（确保它们不被记录在日志中）来注入这些信息。\n\n6.  **监控和日志**：\n    配置集中的日志收集（如ELK Stack）和监控系统（如Prometheus + Grafana），以便实时了解容器和应用的运行状态。',
      timestamp: new Date('2024-01-11T09:45:30'),
    }
  ],
};
const ChatPage = ({ isSidebarCollapsed = false, isLoggedIn, onShowLoginModal }) => {
  const { dialogueId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当路由变化时加载对应的对话内容
  useEffect(() => {
    if (!dialogueId) {
      // 新对话页面，清空消息
      setMessages([]);
      setInputValue('');
    } else if (MOCK_DIALOGUES[dialogueId]) {
      // 加载历史对话
      setMessages(MOCK_DIALOGUES[dialogueId]);
      setInputValue('');
    } else {
      // 新创建的对话，保持当前消息
      // 不做任何操作
    }
  }, [dialogueId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, isExpanded]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const lineHeight = 24;
    const maxLines = isExpanded ? 10 : 3;
    const maxHeight = lineHeight * maxLines;

    if (scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = 'hidden';
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // 检查登录状态
    if (!isLoggedIn) {
      onShowLoginModal();
      return;
    }

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    // 如果是新对话（没有 dialogueId），创建新对话并跳转
    if (!dialogueId) {
      const newDialogueId = `dialogue-${Date.now()}`;
      setMessages([newMessage]);
      setInputValue('');
      setIsExpanded(false);
      
      // 跳转到新对话页面
      navigate(`/chat/${newDialogueId}`);
      
      // 模拟 AI 回复
      setTimeout(() => {
        const aiResponse = {
          id: 2,
          type: 'assistant',
          content: 'This is a simulated AI response. I received your message and I\'m processing it.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    } else {
      // 已有对话，直接添加消息
      setMessages([...messages, newMessage]);
      setInputValue('');
      setIsExpanded(false);

      // 模拟 AI 回复
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          type: 'assistant',
          content: 'This is a simulated AI response. I received your message and I\'m processing it.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('Image uploaded:', file);
        // 这里可以添加图片上传逻辑
      }
    };
    input.click();
  };

  const handleDocumentUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('Document uploaded:', file);
        // 这里可以添加文档上传逻辑
      }
    };
    input.click();
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  };

  const handleEditMessage = (messageId) => {
    console.log('Edit message:', messageId);
    // 这里可以添加编辑消息的逻辑
  };

  const handleRefreshMessage = (messageId) => {
    console.log('Refresh message:', messageId);
    // 这里可以添加重新生成消息的逻辑
  };

  const uploadMenuContent = (
    <div className={styles.uploadMenu}>
      <div className={styles.uploadMenuItem} onClick={handleImageUpload}>
        <FileImageOutlined className={styles.uploadMenuIcon} />
        <span>上传图片</span>
      </div>
      <div className={styles.uploadMenuItem} onClick={handleDocumentUpload}>
        <FileTextOutlined className={styles.uploadMenuIcon} />
        <span>上传文档</span>
      </div>
    </div>
  );

  const handleExportWord = (messageId) => {
    console.log('Export to Word:', messageId);
    message.info('导出为 Word 功能开发中');
    // 这里可以添加导出为 Word 的逻辑
  };

  const handleExportPDF = (messageId) => {
    console.log('Export to PDF:', messageId);
    message.info('导出为 PDF 功能开发中');
    // 这里可以添加导出为 PDF 的逻辑
  };

  const handleExportMarkdown = (messageId) => {
    console.log('Export to Markdown:', messageId);
    message.info('导出为 Markdown 功能开发中');
    // 这里可以添加导出为 Markdown 的逻辑
  };

  const getMoreMenuContent = (messageId) => (
    <div className={styles.uploadMenu}>
      <div className={styles.uploadMenuItem} onClick={() => handleExportWord(messageId)}>
        <span><FileWordOutlined />导出为 Word</span>
      </div>
      <div className={styles.uploadMenuItem} onClick={() => handleExportPDF(messageId)}>
        <span><FilePdfOutlined />导出为 PDF</span>
      </div>
      <div className={styles.uploadMenuItem} onClick={() => handleExportMarkdown(messageId)}>
        <span><FileMarkdownOutlined />导出为 Markdown</span>
      </div>
    </div>
  );

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const needsExpandButton = () => {
    const textarea = textareaRef.current;
    if (!textarea || isExpanded) return false;
    const lineHeight = 24;
    const maxLines = 3;
    return textarea.scrollHeight > lineHeight * maxLines;
  };

  // 判断是否为新对话页面（没有 dialogueId 且没有消息）
  const isNewChat = !dialogueId && messages.length === 0;

  return (
    <div className={styles.chatPage}>
      {isNewChat ? (
        /* 新对话页面 - 居中显示 */
        <div className={styles.newChatContainer}>
          <div className={styles.newChatContent}>
            <div className={styles.logoSection}>
              <img src={assistant} alt="Rice AI" className={styles.newChatLogo} />
              <h1 className={styles.newChatTitle}>Rice Intelligent Agent</h1>
            </div>
            <div className={styles.newChatInputWrapper}>
              <div className={`${styles.inputBox} ${isExpanded ? styles.expanded : ''}`}>
                <textarea
                  ref={textareaRef}
                  className={styles.textarea}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入消息开始对话..."
                  rows={1}
                />
                <div className={styles.inputActions}>
                  <div className={styles.leftActions}>
                    <Popover 
                      content={uploadMenuContent} 
                      trigger="hover"
                      placement="topLeft"
                    >
                      <button className={styles.actionBtn} title="上传文件">
                        <PaperClipOutlined />
                      </button>
                    </Popover>
                    {needsExpandButton() && (
                      <button className={styles.actionBtn} onClick={toggleExpand} title="展开">
                        <ExpandOutlined />
                      </button>
                    )}
                    {isExpanded && (
                      <button className={styles.actionBtn} onClick={toggleExpand} title="收起">
                        <CompressOutlined />
                      </button>
                    )}
                  </div>
                  <button
                    className={`${styles.sendBtn} ${inputValue.trim() ? styles.active : ''}`}
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                  >
                    <SendOutlined />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 消息列表区域 */}
          <div className={styles.messagesContainer}>
        <div className={styles.messagesList}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${message.type === 'user' ? styles.userMessage : styles.assistantMessage
                }`}
            >
              {message.type === 'assistant' && (
                <div className={styles.messageAvatar}>
                  <img src={assistant} alt="" />
                </div>
              )}
              <div className={styles.messageContent}>
                <div className={styles.messageText}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code(props) {
                        const {children, className, node, ...rest} = props
                        // 代码块的 code 标签会被 pre 标签包裹
                        // 行内代码的 code 标签直接在 p 或其他标签内
                        const match = /language-(\w+)/.exec(className || '')
                        
                        // 如果有语言标识或者没有 className 但有内容（无语言的代码块）
                        // 通过检查是否有换行符来判断是否为代码块
                        const hasNewlines = String(children).includes('\n')
                        const isCodeBlock = match || hasNewlines
                        
                        return isCodeBlock ? (
                          <CodeBlock className={className} {...rest}>
                            {children}
                          </CodeBlock>
                        ) : (
                          <code {...rest} className={className}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <div className={styles.messageFooter}>
                  <div className={styles.messageTime}>
                    {message.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className={styles.messageActions}>
                    {message.type === 'user' ? (
                      <>
                        <button
                          className={styles.messageActionBtn}
                          onClick={() => handleCopyMessage(message.content)}
                          title="复制"
                        >
                          <CopyOutlined />
                        </button>
                        <button
                          className={styles.messageActionBtn}
                          onClick={() => handleEditMessage(message.id)}
                          title="编辑"
                        >
                          <EditOutlined />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={styles.messageActionBtn}
                          onClick={() => handleRefreshMessage(message.id)}
                          title="刷新"
                        >
                          <ReloadOutlined />
                        </button>
                        <button
                          className={styles.messageActionBtn}
                          onClick={() => handleCopyMessage(message.content)}
                          title="复制"
                        >
                          <CopyOutlined />
                        </button>
                        <Popover
                          content={getMoreMenuContent(message.id)}
                          trigger="hover"
                          placement="topRight"
                          styles={{
                            container: {
                              padding: 4
                            }
                          }}
                        >
                          <button
                            className={styles.messageActionBtn}
                            title="更多"
                          >
                            <EllipsisOutlined />
                          </button>
                        </Popover>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {message.type === 'user' && (
                <div className={styles.messageAvatar}>
                  <img src={user} alt="" />
                </div>
              )}
            </div>
          ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入框区域 */}
        <div 
          className={styles.inputArea}
          style={{ left: isSidebarCollapsed ? '60px' : '260px' }}
        >
        <div className={`${styles.inputBox} ${isExpanded ? styles.expanded : ''}`}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            rows={1}
          />
          <div className={styles.inputActions}>
            <div className={styles.leftActions}>
              <Popover
                content={uploadMenuContent}
                trigger="hover"
                placement="topLeft"
                styles={{
                  container: {
                    padding: 4
                  }
                }}
              >
                <button className={styles.actionBtn} title="上传文件">
                  <PaperClipOutlined />
                </button>
              </Popover>
              {needsExpandButton() && (
                <button className={styles.actionBtn} onClick={toggleExpand} title="展开">
                  <ExpandOutlined />
                </button>
              )}
              {isExpanded && (
                <button className={styles.actionBtn} onClick={toggleExpand} title="收起">
                  <CompressOutlined />
                </button>
              )}
            </div>
            <button
              className={`${styles.sendBtn} ${inputValue.trim() ? styles.active : ''}`}
              onClick={handleSend}
              disabled={!inputValue.trim()}
            >
              <SendOutlined />
            </button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default ChatPage;