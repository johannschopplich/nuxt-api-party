<template>
  <h2>Playground</h2>
  <ul>
    <li>
      <NuxtLink to="/jsonPlaceholder">
        JSON Placeholder
      </NuxtLink>
    </li>
    <li>
      <NuxtLink to="/petStore">
        Pet Store (OpenAPI)
      </NuxtLink>
    </li>
  </ul>

  <h2>Server Routes (Nitro)</h2>
  <ul>
    <li>
      <NuxtLink to="/api/_jsonPlaceholder" target="_blank">
        JSON Placeholder (Server)
      </NuxtLink>
    </li>
  </ul>
</template>
