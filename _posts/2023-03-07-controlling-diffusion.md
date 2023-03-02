---
layout: single
title:  "Controlling Diffusion - An Overview of Ways to Control Diffusion Models"
date:   2022-07-16 16:08:44 +0200
categories: diffusion control stablediffusion
---


In this post, I will try to compile some methods to steer the diffusion process. Most of these relate to Stable Diffusion. 

Although the mechanisms presented are used in 2D image generation, I assume that they just as well apply to the generation of other modalities.

# Cross Attention

In Stable Diffusion (and Imagen/Dalle 2) text prompts are used to condition the image generation. The text prompts are encoded by a text model. The encoding is passed into the diffusion model to a cross-attention layer. The cross-attention layer can also be used to condition on different information. However, adding new conditioning requires retraining.

This is probably not great when you want to combine multiple conditionings as each would likely require its own cross-attention layers.

- increases model size
- adds cross-attention layers
- requires retraining or finetuning

# Classifier-Free Guidance

# Gradient-Based Guidance -> CLIP Guidance

This method uses the gradients of a distance function to steer image generation.

Concretely: CLIP encodes both text and image into a shared vector space. In CLIP guidance, a difference between the generated image and the text prompt is calculated. From this difference, gradients are calculated and added to the current noise prediction.

Simplified code from [diffusers](https://github.com/huggingface/diffusers/blob/v0.13.1-patch/examples/community/clip_guided_stable_diffusion.py#L167):

```python
loss = spherical_dist_loss(image_embeddings_clip, text_embeddings_clip).mean() * clip_guidance_scale
grads = -torch.autograd.grad(loss, latents)[0]
noise_pred = noise_pred_original - torch.sqrt(beta_prod_t) * grads
```

As far as I know, this has also been used to enforce depth in generated images by using a MiDaS model.

It has also been used to [generate 3D objects without any training data](https://hanhung.github.io/PureCLIPNeRF/)!

- no increase in model size
- no retraining
- you could apply multiple conditionings this way


# Concatenation

If the conditioning you want to use has the same size as the diffusion model input, you can use concatenation. If it doesn't you can embed it into this shape. 

For example, you can train an upsampling model by concatenating (in the channel dimension) the noisy input and a lower-resolution input that is bilinearly upsampled to the input size. This means the input size of the model increases from `BxCxHxW` to `Bx2*CxHxW` ("Guided-Diffusion Paper").

Some video diffusion papers applied this method to interpolate frames in the frame/time dimension.

- increases input size in the channel dimension
- requires retraining or finetuning


# Partial Diffusion (Inpainting/Outpainting)

This method is limited to inpainting and outpainting based on existent image areas. It works by only using random noise for the new areas to generate and using noised original image areas for the areas to keep.

Example:

```python
noisy_guidance_latents = scheduler.add_noise(original_image_latents, guidance_noise, timestep)
latent_model_input = latent_model_input * (1 - mask) + noisy_guidance_latents * mask
noise_pred = self.unet(latent_model_input, timestep, encoder_hidden_states=text_embeddings,).sample
```

This can also be used for video diffusion to generate new frames based on previous ones (something I have done). The advantage of this method is that it does not require retraining.

# [ControlNet](https://github.com/lllyasviel/ControlNet)

ControlNet introduces additional control to an existing diffusion model by copying only the downsample layer weights. The original weights are frozen and the copied weights are connected to the original model via a "zero convolution" after the downsample part of the model. 

The copied weights are finetuned while connected to the 

What a zero-convolution is:

![ControlNet Architecture]({{site.url}}/assets/images/controlnet.png)

# T2I-Adapter

