import { User, Notebook, Source, Message, SourceType, Citation } from './types';

export const mockUser: User = {
  id: '1',
  name: 'Aruna',
  email: 'aruna@example.com',
};

export const mockNotebooks: Notebook[] = [
  {
    id: 'nb-1',
    title: 'Machine Learning Research',
    description: 'Deep learning papers, lecture notes, and tutorials',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-05T12:00:00Z'),
  },
  {
    id: 'nb-2',
    title: 'Web Development Guide',
    description: 'Frontend frameworks, APIs, and best practices',
    createdAt: new Date('2024-01-10T10:00:00Z'),
    updatedAt: new Date('2024-01-11T12:00:00Z'),
  },
  {
    id: 'nb-3',
    title: 'Product Design Notes',
    description: 'UI/UX principles, case studies, and design systems',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-16T12:00:00Z'),
  },
];

export const mockSources: Source[] = [
  {
    id: 'src-1',
    notebookId: 'nb-1',
    name: 'Attention Is All You Need.pdf',
    type: 'pdf',
    status: 'ready',
    metadata: { pageCount: 15 },
    addedAt: new Date('2024-01-01T10:05:00Z'),
  },
  {
    id: 'src-2',
    notebookId: 'nb-1',
    name: 'Stanford CS229 - Lecture 1',
    type: 'youtube',
    status: 'ready',
    metadata: { url: 'https://youtube.com/watch?v=jGwO_UgTS7I', duration: '1:15:30' },
    addedAt: new Date('2024-01-02T10:05:00Z'),
  },
  {
    id: 'src-3',
    notebookId: 'nb-1',
    name: 'PyTorch Documentation',
    type: 'url',
    status: 'indexing',
    metadata: { url: 'https://pytorch.org/docs' },
    addedAt: new Date('2024-01-03T10:05:00Z'),
  },
  {
    id: 'src-4',
    notebookId: 'nb-1',
    name: 'Personal Study Notes',
    type: 'text',
    status: 'ready',
    addedAt: new Date('2024-01-04T10:05:00Z'),
  },
  {
    id: 'src-5',
    notebookId: 'nb-1',
    name: 'CS229 Lecture Transcript.vtt',
    type: 'vtt',
    status: 'ready',
    addedAt: new Date('2024-01-05T10:05:00Z'),
  },
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    notebookId: 'nb-1',
    role: 'user',
    content: 'What is the transformer architecture?',
    createdAt: new Date('2024-01-06T10:00:00Z'),
  },
  {
    id: 'msg-2',
    notebookId: 'nb-1',
    role: 'assistant',
    content: 'The transformer architecture is a deep learning model introduced in the paper "Attention Is All You Need." It replaces recurrent neural networks (RNNs) and convolutional neural networks (CNNs) with a mechanism called self-attention, which allows the model to weigh the importance of different parts of the input sequence simultaneously. This enables highly parallelizable training and significantly better performance on sequential tasks like natural language processing.\n\nThe core of the transformer is its encoder-decoder structure. The encoder processes the input sequence and maps it into a continuous representation that holds the learned information. The decoder then uses this representation to generate the output sequence, one element at a time. Each encoder and decoder layer consists of a multi-head self-attention mechanism and a position-wise fully connected feed-forward network. A key innovation of the transformer is its ability to handle long-range dependencies efficiently without the bottleneck of sequential processing, making it the foundation for modern large language models.',
    citations: [
      {
        id: 'cit-1',
        sourceId: 'src-1',
        sourceName: 'Attention Is All You Need.pdf',
        sourceType: 'pdf',
        chunkText: 'An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors.',
        chunkIndex: 0,
        metadata: { pageNumber: 3 },
      },
      {
        id: 'cit-2',
        sourceId: 'src-2',
        sourceName: 'Stanford CS229 - Lecture 1',
        sourceType: 'youtube',
        chunkText: 'Now let\'s talk about how these transformer layers actually process the tokens in parallel rather than sequentially.',
        chunkIndex: 1,
        metadata: { timestamp: '15:42' },
      },
      {
        id: 'cit-3',
        sourceId: 'src-4',
        sourceName: 'Personal Study Notes',
        sourceType: 'text',
        chunkText: 'Transformers use an encoder-decoder architecture but rely entirely on attention mechanisms to draw global dependencies between input and output.',
        chunkIndex: 2,
      },
    ],
    createdAt: new Date('2024-01-06T10:01:00Z'),
  },
  {
    id: 'msg-3',
    notebookId: 'nb-1',
    role: 'user',
    content: 'How does self-attention work?',
    createdAt: new Date('2024-01-06T10:05:00Z'),
  },
  {
    id: 'msg-4',
    notebookId: 'nb-1',
    role: 'assistant',
    content: 'Self-attention is a mechanism that allows the model to relate different positions of a single sequence to compute a representation of the sequence. It works by creating three vectors from each input vector: a Query vector, a Key vector, and a Value vector.\n\nTo compute the attention score for a specific word, the model takes the dot product of its Query vector with the Key vectors of all other words in the sequence. These scores are then scaled and passed through a softmax function to obtain weights that sum to 1. Finally, the model multiplies each word\'s Value vector by its corresponding weight and sums them up. This resulting vector becomes the new representation for the word, capturing the context from the entire sequence.',
    citations: [
      {
        id: 'cit-4',
        sourceId: 'src-1',
        sourceName: 'Attention Is All You Need.pdf',
        sourceType: 'pdf',
        chunkText: 'Self-attention, sometimes called intra-attention is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence.',
        chunkIndex: 3,
        metadata: { pageNumber: 4 },
      },
      {
        id: 'cit-5',
        sourceId: 'src-1',
        sourceName: 'Attention Is All You Need.pdf',
        sourceType: 'pdf',
        chunkText: 'We compute the attention function on a set of queries simultaneously, packed together into a matrix Q. The keys and values are also packed together into matrices K and V.',
        chunkIndex: 4,
        metadata: { pageNumber: 5 },
      },
    ],
    createdAt: new Date('2024-01-06T10:06:00Z'),
  },
];

export const mockSourceContents: Record<string, string> = {
  'src-1': `The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.\n\nRecurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states, as a function of the previous hidden state and the input for position. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples.\n\nAttention mechanisms have become an integral part of compelling sequence modeling and transduction models in various tasks, allowing modeling of dependencies without regard to their distance in the input or output sequences. In all but a few cases, however, such attention mechanisms are used in conjunction with a recurrent network. In this work we propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output.`,
  'src-2': `Welcome to CS229. Today we're going to start our journey into machine learning. This is a fascinating field that has seen incredible growth over the past decade. We'll be covering everything from linear regression to complex deep learning architectures.\n\nOne of the most exciting recent developments is the shift towards attention-based models. In the past, we relied heavily on RNNs and LSTMs for sequence data. But these had severe limitations when it came to long-term dependencies and parallelization. The sequence of operations meant you couldn't process the whole input at once.\n\nNow let's talk about how these transformer layers actually process the tokens in parallel rather than sequentially. By using self-attention, every token can look at every other token in the sequence simultaneously. This is a massive paradigm shift. It allows us to train models on vastly larger datasets because we can utilize modern GPU hardware much more efficiently.`,
  'src-3': `PyTorch is an open source machine learning framework that accelerates the path from research prototyping to production deployment. It provides two high-level features: Tensor computing (like NumPy) with strong acceleration via graphics processing units (GPUs) and Deep neural networks built on a tape-based autograd system.\n\nThe torch package contains data structures for multi-dimensional tensors and defines mathematical operations over these tensors. Additionally, it provides many utilities for efficient serialization of Tensors and other useful utilities. It has a CUDA counterpart, that enables you to run your tensor computations on an NVIDIA GPU with compute capability >= 3.0.\n\nAt the core of PyTorch is the autograd package, which provides automatic differentiation for all operations on Tensors. It is a define-by-run framework, which means that your backprop is defined by how your code is run, and that every single iteration can be different. This makes it incredibly flexible for researching new architectures.`,
  'src-4': `Key concepts for the upcoming exam: Transformers use an encoder-decoder architecture but rely entirely on attention mechanisms to draw global dependencies between input and output. This was a huge breakthrough because it allowed for much better parallelization during training.\n\nSelf-attention is the core component. It allows a model to weigh the importance of different words in a sequence when processing a specific word. For example, in the sentence "The animal didn't cross the street because it was too tired", self-attention helps the model understand that "it" refers to the "animal" and not the "street".\n\nNeed to remember the math: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V. The scaling factor is important because it prevents the dot products from growing too large, which would push the softmax function into regions where it has extremely small gradients, leading to the vanishing gradient problem.`,
  'src-5': `00:00:00.000 --> 00:00:05.000\nOkay, let's get started with today's lecture on sequence models.\n\n00:00:05.000 --> 00:00:12.000\nWe've discussed recurrent networks in the previous class, and today we'll look at their limitations.\n\n00:00:12.000 --> 00:00:20.000\nThe main issue, as many of you have noticed in your assignments, is that they are very slow to train on long sequences.\n\n00:00:20.000 --> 00:00:30.000\nBecause they process data sequentially, step by step, we can't take full advantage of the parallel processing power of modern GPUs.`,
};
