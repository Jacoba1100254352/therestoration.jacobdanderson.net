<script lang="ts" setup></script>

<template>
	<div text="center gray-700 dark:gray-200">
		<a class="skip-link" href="#main-content">Skip to content</a>
		<TheHeader />
		<main id="main-content" tabindex="-1">
			<RouterView class="px-4 py-5" />
		</main>
		<TheFooter />
		<!--    <div mx-auto mt-5 text-center text-sm opacity-50>
          [Default Layout]
        </div> -->
	</div>
</template>
