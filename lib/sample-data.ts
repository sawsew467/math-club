import { Exam } from '@/types/exam';
import { v4 as uuidv4 } from 'uuid';

export const sampleExams: Exam[] = [
  {
    id: uuidv4(),
    title: 'Kiểm tra giữa kỳ 1 - Lớp 10',
    description: 'Đề kiểm tra giữa kỳ 1 môn Toán lớp 10, gồm các chủ đề: Mệnh đề, Tập hợp, Hàm số',
    grade: 10,
    subject: 'Toán học',
    duration: 90,
    author: 'Thầy Nguyễn Văn A',
    totalPoints: 13,
    isPublished: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    questions: [
      {
        id: uuidv4(),
        question: 'Cho tập hợp $A = \\{1, 2, 3, 4, 5\\}$ và $B = \\{3, 4, 5, 6, 7\\}$. Tìm $A \\cap B$',
        options: [
          '$\\{3, 4, 5\\}$',
          '$\\{1, 2, 3, 4, 5, 6, 7\\}$',
          '$\\{1, 2\\}$',
          '$\\{6, 7\\}$'
        ],
        correctAnswer: 0,
        explanation: 'Giao của hai tập hợp $A \\cap B$ là tập hợp gồm các phần tử thuộc cả $A$ và $B$. Ta có: $A \\cap B = \\{3, 4, 5\\}$',
        points: 1,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Giải phương trình: $x^2 - 5x + 6 = 0$',
        options: [
          '$x = 2$ hoặc $x = 3$',
          '$x = 1$ hoặc $x = 6$',
          '$x = -2$ hoặc $x = -3$',
          '$x = 0$ hoặc $x = 5$'
        ],
        correctAnswer: 0,
        explanation: 'Phân tích thành nhân tử: $x^2 - 5x + 6 = (x-2)(x-3) = 0$. Suy ra $x = 2$ hoặc $x = 3$',
        points: 2,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Mệnh đề nào sau đây là mệnh đề sai?',
        options: [
          '$\\pi > 3.14$',
          '$\\sqrt{2}$ là số vô tỉ',
          '$2 + 2 = 5$',
          'Số 0 là số tự nhiên'
        ],
        correctAnswer: 2,
        explanation: 'Mệnh đề "$2 + 2 = 5$" là mệnh đề sai vì $2 + 2 = 4$, không bằng 5',
        points: 1,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Tìm tập xác định của hàm số $y = \\frac{1}{x-2}$',
        options: [
          '$\\mathbb{R} \\setminus \\{2\\}$',
          '$\\mathbb{R}$',
          '$(2, +\\infty)$',
          '$(-\\infty, 2)$'
        ],
        correctAnswer: 0,
        explanation: 'Hàm số xác định khi mẫu khác 0, tức là $x - 2 \\neq 0 \\Rightarrow x \\neq 2$. Vậy TXĐ: $D = \\mathbb{R} \\setminus \\{2\\}$',
        points: 2,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Phát biểu "Nếu $a > b$ thì $a^2 > b^2$" là đúng hay sai?',
        options: ['Đúng', 'Sai'],
        correctAnswer: 1,
        explanation: 'Phát biểu này sai. Ví dụ phản chứng: $a = 1, b = -2$. Ta có $1 > -2$ nhưng $1^2 = 1 < 4 = (-2)^2$',
        points: 1,
        type: 'true-false'
      },
      {
        id: uuidv4(),
        question: 'Cho hàm số $f(x) = x^2 + 2x + 1$. Tính $f(-1)$',
        options: [
          '$0$',
          '$1$',
          '$2$',
          '$4$'
        ],
        correctAnswer: 0,
        explanation: '$f(-1) = (-1)^2 + 2(-1) + 1 = 1 - 2 + 1 = 0$',
        points: 1,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Tìm nghiệm của bất phương trình $2x - 3 < 5$',
        options: [
          '$x < 4$',
          '$x > 4$',
          '$x < 1$',
          '$x > 1$'
        ],
        correctAnswer: 0,
        explanation: '$2x - 3 < 5 \\Rightarrow 2x < 8 \\Rightarrow x < 4$',
        points: 2,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Giải hệ phương trình: $$\\begin{cases} 2x + 3y = 7 \\\\ x - y = 1 \\end{cases}$$',
        options: [],
        correctAnswer: `Từ phương trình (2): $x = y + 1$

Thế vào phương trình (1):
$2(y + 1) + 3y = 7$
$2y + 2 + 3y = 7$
$5y = 5$
$y = 1$

Suy ra: $x = y + 1 = 1 + 1 = 2$

Kiểm tra lại:
- $2(2) + 3(1) = 4 + 3 = 7$ ✓
- $2 - 1 = 1$ ✓

Vậy nghiệm của hệ phương trình là: $(x, y) = (2, 1)$`,
        explanation: 'Sử dụng phương pháp thế hoặc phương pháp cộng đại số để giải hệ phương trình',
        points: 3,
        type: 'essay',
        rubric: '- Chọn đúng phương pháp giải: 1 điểm\n- Tính toán chính xác: 1 điểm\n- Kiểm tra lại kết quả: 1 điểm'
      }
    ]
  },
  {
    id: uuidv4(),
    title: 'Đề thi thử THPT Quốc gia - Lớp 12',
    description: 'Đề thi thử THPT Quốc gia môn Toán, gồm các chủ đề: Hàm số, Logarit, Tích phân, Hình học không gian',
    grade: 12,
    subject: 'Toán học',
    duration: 120,
    author: 'Cô Trần Thị B',
    totalPoints: 15,
    isPublished: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    questions: [
      {
        id: uuidv4(),
        question: 'Tính đạo hàm của hàm số $y = \\ln(x^2 + 1)$',
        options: [
          '$y\' = \\frac{2x}{x^2 + 1}$',
          '$y\' = \\frac{1}{x^2 + 1}$',
          '$y\' = \\frac{x}{x^2 + 1}$',
          '$y\' = 2x \\ln(x^2 + 1)$'
        ],
        correctAnswer: 0,
        explanation: 'Sử dụng công thức đạo hàm hàm hợp: $(\\ln u)\' = \\frac{u\'}{u}$. Với $u = x^2 + 1$, ta có $u\' = 2x$. Vậy $y\' = \\frac{2x}{x^2 + 1}$',
        points: 2,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Tính tích phân $\\int_0^1 x^2 dx$',
        options: [
          '$\\frac{1}{3}$',
          '$\\frac{1}{2}$',
          '$1$',
          '$\\frac{2}{3}$'
        ],
        correctAnswer: 0,
        explanation: '$\\int_0^1 x^2 dx = \\left[\\frac{x^3}{3}\\right]_0^1 = \\frac{1}{3} - 0 = \\frac{1}{3}$',
        points: 2,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Giải phương trình $2^x = 8$',
        options: [
          '$x = 3$',
          '$x = 2$',
          '$x = 4$',
          '$x = 8$'
        ],
        correctAnswer: 0,
        explanation: '$2^x = 8 = 2^3 \\Rightarrow x = 3$',
        points: 1,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Trong không gian $Oxyz$, cho điểm $A(1, 2, 3)$ và $B(4, 5, 6)$. Tính độ dài đoạn thẳng $AB$',
        options: [
          '$3\\sqrt{3}$',
          '$3\\sqrt{2}$',
          '$6$',
          '$9$'
        ],
        correctAnswer: 0,
        explanation: '$AB = \\sqrt{(4-1)^2 + (5-2)^2 + (6-3)^2} = \\sqrt{9 + 9 + 9} = \\sqrt{27} = 3\\sqrt{3}$',
        points: 2,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Hàm số $y = x^3 - 3x + 1$ có bao nhiêu điểm cực trị?',
        options: [
          '2 điểm',
          '1 điểm',
          '0 điểm',
          '3 điểm'
        ],
        correctAnswer: 0,
        explanation: '$y\' = 3x^2 - 3 = 3(x^2 - 1) = 3(x-1)(x+1) = 0 \\Rightarrow x = \\pm 1$. Hàm số có 2 điểm cực trị tại $x = -1$ và $x = 1$',
        points: 2,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Giới hạn $\\lim_{x \\to 0} \\frac{\\sin x}{x}$ bằng',
        options: [
          '$1$',
          '$0$',
          '$\\infty$',
          'Không tồn tại'
        ],
        correctAnswer: 0,
        explanation: 'Đây là giới hạn cơ bản: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$',
        points: 1,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Cho hàm số $y = x^3 - 3x^2 + 2$. Viết phương trình tiếp tuyến của đồ thị hàm số tại điểm có hoành độ $x_0 = 1$.',
        options: [],
        correctAnswer: `Tại $x_0 = 1$:
- $y_0 = 1^3 - 3(1)^2 + 2 = 0$
- $y' = 3x^2 - 6x$
- $y'(1) = 3(1)^2 - 6(1) = -3$

Phương trình tiếp tuyến:
$y - y_0 = y'(x_0)(x - x_0)$
$y - 0 = -3(x - 1)$
$y = -3x + 3$

Vậy phương trình tiếp tuyến là: $y = -3x + 3$`,
        explanation: 'Công thức phương trình tiếp tuyến: $y - y_0 = f\'(x_0)(x - x_0)$',
        points: 3,
        type: 'essay',
        rubric: '- Tính đúng $y_0$: 1 điểm\n- Tính đúng đạo hàm $y\'(1)$: 1 điểm\n- Viết đúng phương trình: 1 điểm'
      },
      {
        id: uuidv4(),
        question: 'Trong không gian $Oxyz$, cho mặt cầu $(S): x^2 + y^2 + z^2 - 2x + 4y - 6z + 5 = 0$. Tìm tâm và bán kính của mặt cầu.',
        imageUrl: 'https://i.imgur.com/8XkQ3zN.png',
        options: [
          'Tâm $I(1, -2, 3)$, bán kính $R = 3$',
          'Tâm $I(-1, 2, -3)$, bán kính $R = 3$',
          'Tâm $I(1, -2, 3)$, bán kính $R = 9$',
          'Tâm $I(2, -4, 6)$, bán kính $R = 3$'
        ],
        correctAnswer: 0,
        explanation: 'Từ phương trình: $x^2 + y^2 + z^2 - 2x + 4y - 6z + 5 = 0$\n$(x-1)^2 + (y+2)^2 + (z-3)^2 = 1 + 4 + 9 - 5 = 9$\nVậy tâm $I(1, -2, 3)$ và bán kính $R = 3$',
        points: 2,
        type: 'multiple-choice'
      }
    ]
  },
  {
    id: uuidv4(),
    title: 'Bài tập Hình học - Lớp 11',
    description: 'Bài tập về Hình học không gian: Quan hệ song song và vuông góc',
    grade: 11,
    subject: 'Toán học',
    duration: 60,
    author: 'Thầy Lê Văn C',
    totalPoints: 18,
    isPublished: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    questions: [
      {
        id: uuidv4(),
        question: 'Trong không gian, hai đường thẳng song song thì:',
        options: [
          'Cùng nằm trong một mặt phẳng và không có điểm chung',
          'Không có điểm chung',
          'Cùng vuông góc với một đường thẳng',
          'Cùng song song với một mặt phẳng'
        ],
        correctAnswer: 0,
        explanation: 'Hai đường thẳng song song là hai đường thẳng cùng nằm trong một mặt phẳng và không có điểm chung',
        points: 2,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông. Mệnh đề "$SA \\perp (ABCD)$" có nghĩa là:',
        options: [
          '$SA$ vuông góc với mọi đường thẳng nằm trong mặt phẳng $(ABCD)$',
          '$SA$ vuông góc với $AB$',
          '$SA$ vuông góc với $AC$',
          '$SA$ vuông góc với $BD$'
        ],
        correctAnswer: 0,
        explanation: 'Đường thẳng vuông góc với mặt phẳng khi và chỉ khi nó vuông góc với mọi đường thẳng nằm trong mặt phẳng đó',
        points: 2,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Trong không gian, hai mặt phẳng phân biệt cùng vuông góc với một đường thẳng thì:',
        options: [
          'Song song với nhau',
          'Vuông góc với nhau',
          'Trùng nhau',
          'Cắt nhau'
        ],
        correctAnswer: 0,
        explanation: 'Hai mặt phẳng phân biệt cùng vuông góc với một đường thẳng thì song song với nhau',
        points: 2,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Cho tứ diện đều $ABCD$. Góc giữa hai cạnh $AB$ và $CD$ bằng:',
        options: [
          '$90°$',
          '$60°$',
          '$45°$',
          '$120°$'
        ],
        correctAnswer: 0,
        explanation: 'Trong tứ diện đều, hai cạnh đối diện vuông góc với nhau, nên góc giữa $AB$ và $CD$ là $90°$',
        points: 2,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Mệnh đề "Nếu một đường thẳng vuông góc với hai đường thẳng cắt nhau cùng nằm trong một mặt phẳng thì nó vuông góc với mặt phẳng đó" là đúng hay sai?',
        options: ['Đúng', 'Sai'],
        correctAnswer: 0,
        explanation: 'Đây là định lý về điều kiện để đường thẳng vuông góc với mặt phẳng',
        points: 2,
        type: 'true-false'
      },
      {
        id: uuidv4(),
        question: 'Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$. Biết $SA \\perp (ABCD)$ và $SA = a\\sqrt{2}$. Tính góc giữa đường thẳng $SC$ và mặt phẳng $(ABCD)$.',
        imageUrl: 'https://i.imgur.com/YPkKZXx.png',
        options: ['$30°$', '$45°$', '$60°$', '$90°$'],
        correctAnswer: 1,
        explanation: 'Góc giữa $SC$ và $(ABCD)$ là góc $\\widehat{SCA}$. Ta có: $AC = a\\sqrt{2}$ (đường chéo hình vuông). $\\tan(\\widehat{SCA}) = \\frac{SA}{AC} = \\frac{a\\sqrt{2}}{a\\sqrt{2}} = 1 \\Rightarrow \\widehat{SCA} = 45°$',
        points: 3,
        type: 'multiple-choice'
      },
      {
        id: uuidv4(),
        question: 'Chứng minh rằng trong một tứ diện đều, hai cạnh đối diện vuông góc với nhau. Áp dụng: Cho tứ diện đều $ABCD$ cạnh $a$, tính khoảng cách giữa hai đường thẳng $AB$ và $CD$.',
        options: [],
        correctAnswer: `**Phần 1: Chứng minh**
Gọi $M$ là trung điểm $CD$. Trong tứ diện đều, ta có:
- $AM = BM$ (do $\\triangle ACD = \\triangle BCD$)
- $M$ là trung điểm $CD$ nên $AM \\perp CD$ và $BM \\perp CD$

Suy ra $CD \\perp (ABM) \\Rightarrow CD \\perp AB$

**Phần 2: Áp dụng**
Gọi $M, N$ lần lượt là trung điểm $AB$ và $CD$.
- Đoạn $MN$ là đoạn vuông góc chung của $AB$ và $CD$
- Trong tứ diện đều cạnh $a$: $MN = \\frac{a\\sqrt{2}}{2}$

Vậy khoảng cách giữa $AB$ và $CD$ là $\\frac{a\\sqrt{2}}{2}$`,
        explanation: 'Trong tứ diện đều, khoảng cách giữa hai cạnh đối diện bằng $\\frac{a\\sqrt{2}}{2}$ với $a$ là độ dài cạnh',
        points: 5,
        type: 'essay',
        rubric: '- Chứng minh hai cạnh đối vuông góc: 2 điểm\n- Xác định đúng đoạn vuông góc chung: 1 điểm\n- Tính đúng khoảng cách: 2 điểm'
      }
    ]
  }
];

export function initSampleData() {
  const existingData = localStorage.getItem('exam-storage');

  if (!existingData || JSON.parse(existingData).state.exams.length === 0) {
    const initialData = {
      state: {
        exams: sampleExams,
        results: []
      },
      version: 0
    };

    localStorage.setItem('exam-storage', JSON.stringify(initialData));
    return true;
  }

  return false;
}