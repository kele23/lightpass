<script setup lang="ts"></script>

<template>
  <div>
    <div class="w-full items-start xl:flex">
      <main class="w-full grow xl:w-auto xl:pr-4">
        <slot name="content" />
      </main>
      <aside
        class="grid w-full shrink-0 grow-0 grid-cols-1 flex-wrap items-start justify-between gap-4 md:grid-cols-2 lg:grid-cols-3 xl:sticky xl:top-0 xl:w-80 xl:grid-cols-1"
      >
        <slot name="sidebar" />
      </aside>
    </div>
    <slot name="after" />
  </div>
</template>
