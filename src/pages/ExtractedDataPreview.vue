<script setup lang="ts">
import { useRouter } from "vue-router";
import { useImageStore } from "../store";
import { Button } from "frappe-ui";

const router = useRouter() // Create a router instance to use for navigation

const imageStore = useImageStore() // Create an instance of the image store to access the extracted data

/// Event Handlers
function onBackPress() {
    // Function to handle the back button press
    router.push({ name: "capture-photo-scan" }) // Navigate to the "capture-photo-scan" page
}
</script>

<template>
    <div class="container mx-auto p-4">
        <!-- Main container with padding and centered content -->
        <div>
            <div class="flex flex-row justify-between items-center py-4">
                <!-- Header section with title and back button -->
                <h1
                    class="text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-p-3xl dark:text-white">
                    <!-- Title with different styles for different screen sizes -->
                    Extracted Data Preview</h1>
                <Button variant="outline" theme="gray" size="lg" label="Back" @click="onBackPress">
                    <!-- Back button with an outline style, gray theme, large size, and click event handler -->
                    Back
                </Button>
            </div>
            <table class="table-auto w-full text-left rtl:text-right text-gray-700 dark:text-gray-400"
                v-for="table in imageStore.extractedTable?.tables">
                <!-- Table to display the extracted data, iterating over each table in the extracted data -->
                <thead class="text-gray-800 uppercase bg-gray-200 dark:bg-gray-700 dark:text-gray-400">
                    <!-- Table header with styles for light and dark modes -->
                    <tr>
                        <td class="px-2 py-2" v-for="cell in table.rows[0].cells">{{ cell }}</td>
                        <!-- Table header cells, iterating over the first row of each table -->
                    </tr>
                </thead>
                <tbody>
                    <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                        v-for="row in table.rows.slice(1)">
                        <!-- Table body rows, iterating over the rows except the first one -->
                        <td class="px-2 py-2" v-for="cell in row.cells">{{ cell }}</td>
                        <!-- Table body cells, iterating over each cell in the row -->
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style lang="postcss" scoped></style>
<!-- Scoped styles for this component using PostCSS -->
