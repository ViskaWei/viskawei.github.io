
>[!tip] Research Question:
> 1.  **Optimal Architectures Selection:**  What is the most effective model architecture for analyzing stellar spectra among the following: Encoder-only (BERT-based), Encoder-decoder (Transformer-based), and Decoder-only (GPT-based) models?
> 	- **Effectiveness of Attention Mechanism**: Does the attention layer outperform traditional models such as Convolutional Neural Networks (CNN), Multi-Layer Perceptrons (MLP), and Dense Neural Networks (DNN) in extracting information from stellar spectra?
> 	- **Correlation Between Reconstruction Loss and Classification Performance**: Does a lower reconstruction loss translate to better inference and classification ability in the context of stellar spectral analysis? 
> 1. **Optimal Tokenization Strategies**: Which tokenization strategies are most effective in extracting spectral signals? What are the underlying reasons for their effectiveness?
> 	- **Physics Informed Positional Embedding**: Given the sensitivity of spectral data to positional information, which positional embedding method is most effective for spectral tokenization?
> 	- **Discrete vs Continuous Tokenization**: Which approach is more effective for spectral data, and what are the comparative advantages and disadvantages of each?

>[!done] Focused
>1. Is Attention layer better than CNN? When is it better?
>2. Is discrete tokenization better than continous tokenization? Why or Why not?
>	- The key difference between LLMs and other NNs is it’s discrete tokenization.
>	- Borrowing ideas from video generation

3.(Optional) Which positional embedding works best for Spectra?
4.(Optional) Which architecture works best for spectra?
	Encoder-only (ViT) , Encoder-Decoder (Transformer), Decoder-only (SpectraTr) 


>[!note] Abstract
> This study explores optimal model architectures and tokenization strategies for stellar spectral analysis. It evaluates the effectiveness of three model architectures—Encoder-only (BERT-based), Encoder-decoder (Transformer-based), and Decoder-only (GPT-based)—in processing stellar spectral data, and examines the superiority of attention mechanisms over traditional models like CNNs, MLPs, and DNNs. Additionally, the study investigates the relationship between reconstruction loss and classification performance, determining if lower reconstruction loss leads to better inference and classification accuracy. 
> The research also delves into the most effective tokenization strategies for spectral signals, considering the importance of physics-informed positional embedding. It compares discrete and continuous tokenization methods, analyzing their respective advantages and disadvantages. The findings aim to improve the accuracy and efficiency of stellar spectral analysis, contributing to advancements in astronomical data processing techniques.

- [[#Introduction|Introduction]]
	- [[#Introduction#Related Work|Related Work]]
- [[#Methodology|Methodology]]
	- [[#Methodology#Model Architectures|Model Architectures]]
		- [[#Model Architectures#Vision Transformer (ViT) Architecture [GPT generated]|Vision Transformer (ViT) Architecture [GPT generated]]]
- [[#Effectiveness of Attention Mechanism|Effectiveness of Attention Mechanism]]
	- [[#Effectiveness of Attention Mechanism#Observations:|Observations:]]
- [[#Ablation Study on Tokenization|Ablation Study on Tokenization]]
	- [[#Ablation Study on Tokenization#Tokenization Strategies|Tokenization Strategies]]
		- [[#Tokenization Strategies#1. Directly Chunking into Fixed-Size Blocks|1. Directly Chunking into Fixed-Size Blocks]]
		- [[#Tokenization Strategies#2. Sliding Window with 5-10 Pixels Overlap|2. Sliding Window with 5-10 Pixels Overlap]]
		- [[#Tokenization Strategies#3. Normalizing Each Block Before Input|3. Normalizing Each Block Before Input]]
		- [[#Tokenization Strategies#4. Discretized Tokens (Lookup Table Mapping)|4. Discretized Tokens (Lookup Table Mapping)]]
	- [[#Ablation Study on Tokenization#Discrete vs Continuous Tokenization|Discrete vs Continuous Tokenization]]
	- [[#Ablation Study on Tokenization#Physics Informed Positional Encoding|Physics Informed Positional Encoding]]
- [[#One more thing...|One more thing...]]

---
## Introduction

Stellar spectra serve as crucial indicators of the physical and chemical properties of stars, making their classification a vital area of research. This classification facilitates the discovery and identification of rare celestial objects and the analysis of stellar kinematics.

Over time, various methods for stellar spectral classification have been developed. Initially, the Secchi classification system was employed, followed by the Harvard system, the Morgan-Keenan (MK) classification system, and the Kinman system. The Kinman system, which is an extension of the Harvard system, classifies spectra into seven primary categories (O, B, A, F, G, K, M) based on stellar surface temperature, with each category further subdivided into ten subclasses. This system remains the most widely used classification method today.

In recent years, stellar spectral classification methodologies have generally been categorized into traditional machine learning methods and deep learning methods. Traditional machine learning methods include algorithms such as k-Nearest Neighbors (k-NN), Support Vector Machines (SVM), and Random Forests. These methods typically involve extracting shallow features from the spectra and subsequently performing classification based on these features. For instance, SVMs have been utilized to classify stellar spectra by representing training set distributions through intra-class and inter-class scatter matrices, which evaluate sample distances for classification. Additionally, Random Forest algorithms have been applied to identify important spectral features for the binary classification of subdwarf and dwarf stars.

**However, traditional machine learning methods often rely on shallow feature extraction, which proves less effective in handling large volumes of spectral data.** In contrast, deep learning algorithms can perform data-driven feature extraction, enhancing their efficiency and robustness. Convolutional Neural Networks (CNNs) and Autoencoders have been used to extract features from spectra and restore defective spectral data. For example, CNNs have achieved higher accuracy in classifying O, B, A, F, G, K, M-type stellar spectra compared to traditional machine learning algorithms. Capsule Networks have also been proposed for stellar spectral classification by transforming one-dimensional stellar spectra into two-dimensional Fourier spectra images, enabling automatic classification with improved results over CNNs.

Building on the success of deep learning in natural language processing and image classification tasks, the Transformer architecture, particularly the Vision Transformer (ViT), has demonstrated significant potential. Renowned for its ability to model long-range dependencies and capture global context, ViT has been widely applied in image classification, object detection, and image segmentation. This study leverages the strengths of the Vision Transformer architecture for the classification and regression of stellar spectra, aiming to exploit its advanced capabilities in modeling spectral data.

---
>[!warning] Main Contributions: 
> - Conduct a comprehensive comparison of model architectures (Encoder-only, Encoder-decoder, Decoder-only) for stellar spectra analysis.
> - Perform an in-depth evaluation of the **attention mechanism's effectiveness** against traditional models (CNN, MLP, DNN) in extracting information from stellar spectra.
> - Investigate the **correlation between reconstruction loss and classification performance** to enhance inference and classification accuracy.
> - Conduct an **ablation study on tokenization strategies** to identify the most effective approach for spectral signals.
> - Evaluate the impact of **physics-informed positional embedding** on spectral tokenization and identify the best method.
> - Compare and contrast **discrete and continuous tokenization** techniques to determine the optimal approach for handling spectral data.


---
### Related Work

1. **Vision Transformer (ViT)**: ViT, initially proposed by Dosovitskiy et al., demonstrated superior performance over traditional CNNs in image classification tasks. ViT uses the self-attention mechanism to capture global features in the data.
2. **Spectral Data Analysis**: Traditional spectral analysis methods mainly rely on physical models, such as the Saha equation and radiative transfer equation. Recently, deep learning methods have been increasingly applied to spectral data classification and regression tasks, showing promising performance.
3. The **Cannon**, based on Ridge regression, fall short in expressiveness.(Ness et al., 2015)
4. The **Payne**, which relies on a neural network-based multilayer perceptron, does not impose sufficient inductive bias and hence its performance plateaus with large training data. (Ting et al., 2019; Straumit et al., 2022; Xiang et al., 2022)

---
## Methodology

### Model Architectures

--- start-multi-column: ID_lllr
```column-settings
Number of Columns: 2
Largest Column: standard
```

Decoder only Model


--- column-break ---

![[Screenshot 2024-06-28 at 10.21.52 AM.png|300]]
--- end-multi-column



#### Vision Transformer (ViT) Architecture [GPT generated]

The Vision Transformer (ViT) is a deep learning architecture that applies the principles of transformers, originally developed for natural language processing (NLP), to image recognition tasks. The transformer architecture relies heavily on self-attention mechanisms to process and interpret data. 
##### Key Components of Vision Transformer
1. **Image Patch Embedding**:
   - **Input Representation**: Instead of processing an image pixel by pixel or through convolutions, the ViT divides an image into fixed-size patches (e.g., 16x16 pixels).
   - **Linear Embedding**: Each patch is flattened into a vector and then linearly embedded into a higher-dimensional space. For example, a patch of size \(16 \times 16\) with three color channels (RGB) will be flattened into a vector of size 768, and then linearly transformed into a vector of the desired embedding dimension (e.g., 768).

2. **Positional Encoding**:
   - Since transformers are permutation invariant, they cannot inherently understand the order or position of patches. To retain positional information, positional encodings are added to each patch embedding. These encodings are fixed vectors that encode the position of each patch within the image.

3. **Transformer Encoder**:
   - **Multi-Head Self-Attention**: Each patch (with added positional encoding) attends to all other patches through a self-attention mechanism. This allows the model to focus on relevant parts of the image, regardless of their spatial distance.
   - **Feed-Forward Network**: After the self-attention layer, each embedding is passed through a feed-forward neural network (the same for each embedding).
   - **Residual Connections and Layer Normalization**: Residual connections around each sub-layer (self-attention and feed-forward) and layer normalization are applied to stabilize training.

4. **Classification Head**:
   - **CLS Token**: A special classification token ([CLS]) is prepended to the sequence of patch embeddings. The final hidden state corresponding to this token is used as the aggregate image representation for classification tasks.
   - **MLP Head**: The [CLS] token is passed through a multi-layer perceptron (MLP) to produce the final classification output.

##### Steps in the ViT Pipeline
1. **Image to Patches**: An input image is divided into non-overlapping patches.
2. **Flattening and Linear Projection**: Each patch is flattened and linearly projected to a fixed-size embedding.
3. **Adding Positional Encodings**: Positional encodings are added to the patch embeddings to retain positional information.
4. **Transformer Encoder Layers**: The patch embeddings (with positional encodings) are passed through multiple layers of the transformer encoder.
5. **Classification**: The output corresponding to the [CLS] token is passed through an MLP head to generate the final classification logits.

##### Advantages of Vision Transformers
1. **Global Context**: The self-attention mechanism allows ViTs to capture global relationships between all patches in an image, which is often challenging for convolutional neural networks (CNNs) that typically focus on local features.
2. **Scalability**: ViTs can be scaled up efficiently by increasing the number of layers or the size of the embeddings, leveraging the success of transformer models in NLP.
3. **Flexibility**: ViTs are not restricted by the inductive biases inherent in CNNs (e.g., locality and translation invariance), potentially making them more versatile.

##### Challenges
1. **Data Efficiency**: ViTs typically require a large amount of training data to perform well, as they lack the strong inductive biases of CNNs.
2. **Computational Resources**: Training and inference with ViTs can be computationally expensive due to the quadratic complexity of the self-attention mechanism with respect to the number of patches.

##### Conclusion
The Vision Transformer (ViT) is a powerful model that brings the advantages of transformer architectures to computer vision. By treating images as sequences of patches and applying self-attention, ViTs can capture complex relationships within the image data, offering a robust alternative to traditional CNNs. However, they require significant computational resources and large datasets to realize their full potential.

![[Pasted image 20240627114728.png]]


---




----
---
## Effectiveness of Attention Mechanism

The performance of different models can vary depending on the task they're being used for and the data available to train them. In general, convolutional neural networks (CNN) have been shown to be effective for tasks such as image classification and object detection where there is spatial structure or patterns present in the input data. On the other hand, attention mechanisms  may perform better when dealing with more abstract concepts that don't necessarily follow clear spatial relationships between features. Attention mechanism might be good at identifing spectral lines from noisy observations, as it can focus on certain regions within each spectrum based on their importance. However, if one wants to classify galaxies into different categories based solely on their morphology without any prior knowledge about which classes contain which types of objects, then using CNN would likely yield superior results due to its ability to learn complex relationships between pixels across multiple dimensions simultaneously. Ultimately, both approaches offer advantages under particular circumstances so it really comes down to understanding how best to apply these techniques given the problem at hand. 

![[Screenshot 2024-06-28 at 11.12.23 AM.png]]We compare the performance of the attention mechanism against neural net based models CNN, MLP, and DNN) and traditional models (PCA, PCP, RandomForrest, Regression) in extracting information from stellar spectra.

| S/N = noiseless           | Dwarf vs Giant ACC | Kappa Coefficient (%) | Inference MSE | Training Time (s) |
| ------------------------- | ------------------ | --------------------- | ------------- | ----------------- |
| PCA                       |                    |                       |               |                   |
| PCP                       |                    |                       |               |                   |
| RandomForrest             |                    |                       |               |                   |
| Regression                |                    |                       |               |                   |
| CNN                       |                    |                       |               |                   |
| MLP                       |                    |                       |               |                   |
| DNN                       |                    |                       |               |                   |
| ViT (Attention Mechanism) |                    |                       |               |                   |

| S/N = 50                  | Dwarf vs Giant ACC | Kappa Coefficient (%) | Inference MSE | Training Time (s) |
| ------------------------- | ------------------ | --------------------- | ------------- | ----------------- |
| PCA                       |                    |                       |               |                   |
| PCP                       |                    |                       |               |                   |
| RandomForrest             |                    |                       |               |                   |
| Regression                |                    |                       |               |                   |
| CNN                       |                    |                       |               |                   |
| MLP                       |                    |                       |               |                   |
| DNN                       |                    |                       |               |                   |
| ViT (Attention Mechanism) |                    |                       |               |                   |

![[Screenshot 2024-06-28 at 11.12.42 AM.png]]
### Observations:

1. **Training Time**:
   - The ViT, utilizing the attention mechanism, has a training time of xxx seconds, which is shorter than MLP (xxx seconds) and PCA (xxx seconds), but longer than CNN (xxx seconds).

2. **Accuracy**:
   - The ViT achieves the highest accuracy at xx%, outperforming MLP (xx%), SVM (xx%), PCA (xx%) and CNN (xx%)...

3. **Kappa Coefficient**:
   - The Kappa coefficient for the ViT is xx%, indicating better agreement with the true labels compared to MLP (xx%), PCA (xx%), and CNN (xx%).

---
## Ablation Study on Tokenization

| DC  | **SW** | **Norm** | **CB** | VPE | RoPE | **PIPE** | ACC         | **MSE** | Other |
| --- | ------ | -------- | ------ | --- | ---- | -------- | ----------- | ------- | ----- |
| ✓   |        |          |        |     |      | ✓        |             |         |       |
|     | ✓      |          |        |     |      | ✓        |             |         |       |
|     |        | ✓        |        |     |      | ✓        |             |         |       |
|     |        |          | ✓      |     |      | ✓        |             |         |       |
|     | ✓      | ✓        |        |     |      | ✓        |             |         |       |
|     |        |          | ✓      | ✓   |      |          |             |         |       |
|     |        |          | ✓      |     | ✓    |          |             |         |       |
|     |        |          | ✓      |     |      | ✓        | pls be high |         |       |

- **Direct Chunking (DC)** : Spectral data is directly divided into fixed-size blocks.
- **Sliding Window (SW)** : Tokenization with overlapping windows of 5-10 pixels.
- **Normalized Chunks (Norm)**: Each chunk of spectral data is normalized before input.
- **Discretized Tokens - Codebook (CB)** : Spectral data is discretized using a lookup table based on k-means clustering.
- **Vanilla Positional Embedding (VPE)**: adding constants to slides
- **Physics-Informed Positional Embedding (PIPE)**: Positional embedding informed by the physical properties of spectral data to preserve positional information more effectively.
- **Dwarf vs Giant Accuracy (ACC)**: classification accuracy.
- **Teff Inference MSE (MSE)**: MSE error on temperature regression 

---
### Tokenization Strategies

#### 1. Directly Chunking into Fixed-Size Blocks
```
def chunk_tokenization(spectra, chunk_size):     
	tokens = [spectra[i:i+chunk_size] for i in range(0, len(spectra), chunk_size)]     
	return torch.tensor(tokens)
```
#### 2. Sliding Window with 5-10 Pixels Overlap

```
def sliding_window_tokenization(spectra, window_size, overlap):     
	step = window_size - overlap     
	tokens = [spectra[i:i+window_size] for i in range(0, len(spectra) - window_size + 1, step)]     
	return torch.tensor(tokens)
```
#### 3. Normalizing Each Block Before Input

```
def normalize_chunks(spectra, chunk_size):     
	tokens = [spectra[i:i+chunk_size] for i in range(0, len(spectra), chunk_size)]     
	normalized_tokens = [(chunk - chunk.mean()) / chunk.std() for chunk in tokens]     
	return torch.tensor(normalized_tokens)
```

#### 4. Discretized Tokens (Lookup Table Mapping)

```
from sklearn.cluster import KMeans  
def discrete_tokenization(spectra, num_clusters):     
	kmeans = KMeans(n_clusters=num_clusters)     
	kmeans.fit(spectra.reshape(-1, 1))     
	discrete_tokens = kmeans.predict(spectra.reshape(-1, 1))     
	return torch.tensor(discrete_tokens)  # Generate lookup table codebook = kmeans.cluster_centers_

```

---
### Discrete vs Continuous Tokenization
!!!very important (I don't have time to work on this yet.) Attaching some thoughts here:
1. Tokenization = compression
2. Tokenizer remains the key bottleneck that **controls sequence length** **and generation quality**.
3. How to design the tokenization that works for spectra?
	1. Spectra != image
	2. Does Ho’s implementation make sense?

![[Screenshot 2024-06-17 at 8.31.17 AM.png]]
Tokenizer designed for different models:
![[Pasted image 20240627145507.png]]


Tokenizer designed for different models:
![[Screenshot 2024-06-16 at 5.22.57 PM.png]]

Paper on discrete tokenization:
https://arxiv.org/pdf/2111.10493
Key idea: Different from the standard continuous pixel tokens, **discrete tokens are invariant under small perturbations and contain less information individually,** which promote ViTs to learn global information that is invariant.

Paper on state-of-the-art video generation: 
[2310.05737](https://arxiv.org/pdf/2310.05737)
LANGUAGE MODEL BEATS DIFFUSION — **TOKENIZER IS KEY TO VISUAL GENERATION**
From Laszlo "For instance, you could just take the original spectrum pixel, then bin each adjacent pixel together, or every four, etc. to build a pyramid. Each of these binned super-pixels would carry less information but with less noise also.

What I would focus on is trying to ember the spectra some way that accounts for the correlations between wavelength because that’s what carries the information, not the values of the individual pixels. Training the full autoencoder is too hard because you have to train for two things in parallel: encoding and reconstruction. If we could somehow train a network to do an optimal embedding, then train to reconstruct the spectra, it could be faster to train the two stages than training in just one run.

But for denoising, we could also consider the spectrum as a signal as a function of wavelength and try some tokenization designed for time-dependent signal and see how that works. In this case the network would never see the complete spectrum, just noisy parts. Still, I’d use significant overlap in the tokenization because of the large noise."

[2406.11838](https://arxiv.org/pdf/2406.11838)



---
### Physics Informed Positional Encoding

RoPE (RoFormer: Enhanced Transformer with Rotary Position Embedding) [\[2104.09864\] RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864)
CoPE (Contextual Position Encoding) [\[2405.18719\] Contextual Position Encoding: Learning to Count What's Important](https://arxiv.org/abs/2405.18719)
![[Screenshot 2024-06-28 at 11.16.30 AM.png |500]]

---
## One more thing...

- **LLMs must see the light**: To achieve artificial general intelligence (AGI), large language models (LLMs) must learn from incorporating real-world signal (spectra, audio, visual signals) alongside textual information.
	
- **Prompting is all you need**: Maybe Prompting, instead of fine-tuning, can generate good enough results already.

	Prompting Survey
  
![[Screenshot 2024-06-27 at 2.58.50 PM.png]]
**Zero-Shot:** {Emotion, Role, Style}-Prompting, S2A, SimToM, RaR, RE2, Self-Ask, DUP,
**Few-Shot:** KNN, VoteK, SG-ICL
**Thought Gen**: Analogical; Step-Back; Active; Complexity; {Uncertainty; Memory, Contrastive, Auto, Tab, Thread}-CoT; Mining;
**Self-Criticism:** Self-{Calibration, Refine, Verification}; Chain-of-Verification; ReverseCoT; Cumulative Reason
**Ensembling:** COSP, DENSE, DiVeRSe, Max Mutual Info, Meta-CoT; MoRE; Universal Self-Consistency; USP; Paraphrasing
**Decmoposition:** DECOMP; Least-to-Most; Plan-and-Solve; {Faithful Chain, Program, Recursive, Skeleton, Tree}-oT

---

