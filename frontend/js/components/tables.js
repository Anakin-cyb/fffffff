/**
 * ResQSync - Tables Component
 */

(function () {
    "use strict";

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function resolveValue(row, column) {
        if (typeof column.value === "function") {
            return column.value(row);
        }

        if (!column.field) {
            return "";
        }

        return column.field
            .split(".")
            .reduce(
                (current, key) =>
                    current?.[key],
                row
            );
    }

    function formatCell(
        value,
        row,
        column
    ) {
        if (typeof column.render === "function") {
            return column.render(value, row);
        }

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "—";
        }

        return escapeHtml(value);
    }

    function buildTableHtml(
        columns,
        rows,
        options = {}
    ) {
        const {
            emptyMessage = "No records found.",
            loading = false,
            tableClass = "",
            tableId = "",
            caption = ""
        } = options;

        const safeTableClass =
            escapeHtml(tableClass);

        const safeTableId =
            escapeHtml(tableId);

        const headerHtml =
            columns
                .map(
                    column => `
                        <th
                            scope="col"
                            ${
                                column.className
                                    ? `class="${escapeHtml(
                                        column.className
                                    )}"`
                                    : ""
                            }
                        >
                            ${escapeHtml(
                                column.label ||
                                column.field ||
                                ""
                            )}
                        </th>
                    `
                )
                .join("");

        let bodyHtml = "";

        if (loading) {
            bodyHtml = `
                <tr>
                    <td
                        class="table-loading"
                        colspan="${columns.length}"
                    >
                        <span class="loading">
                            <span
                                class="loading-spinner"
                                aria-hidden="true"
                            ></span>
                            Loading data...
                        </span>
                    </td>
                </tr>
            `;
        } else if (!rows.length) {
            bodyHtml = `
                <tr>
                    <td
                        class="table-empty"
                        colspan="${columns.length}"
                    >
                        ${escapeHtml(emptyMessage)}
                    </td>
                </tr>
            `;
        } else {
            bodyHtml =
                rows
                    .map(
                        row =>
                            buildRowHtml(
                                row,
                                columns,
                                options
                            )
                    )
                    .join("");
        }

        return `
            <table
                class="table ${safeTableClass}"
                ${
                    safeTableId
                        ? `id="${safeTableId}"`
                        : ""
                }
            >
                ${
                    caption
                        ? `
                            <caption>
                                ${escapeHtml(caption)}
                            </caption>
                        `
                        : ""
                }

                <thead>
                    <tr>
                        ${headerHtml}
                    </tr>
                </thead>

                <tbody>
                    ${bodyHtml}
                </tbody>
            </table>
        `;
    }

    function buildRowHtml(
        row,
        columns,
        options = {}
    ) {
        let rowClass = "";

        if (
            typeof options.rowClass ===
            "function"
        ) {
            rowClass =
                options.rowClass(row) || "";
        } else if (
            typeof options.rowClass ===
            "string"
        ) {
            rowClass =
                options.rowClass;
        }

        const cellsHtml =
            columns
                .map(column => {
                    const value =
                        resolveValue(
                            row,
                            column
                        );

                    const cellContent =
                        formatCell(
                            value,
                            row,
                            column
                        );

                    return `
                        <td
                            ${
                                column.className
                                    ? `class="${escapeHtml(
                                        column.className
                                    )}"`
                                    : ""
                            }
                        >
                            ${cellContent}
                        </td>
                    `;
                })
                .join("");

        return `
            <tr
                ${rowClass
                    ? `class="${escapeHtml(
                        rowClass
                    )}"`
                    : ""}
            >
                ${cellsHtml}
            </tr>
        `;
    }

    function render(
        container,
        columns = [],
        rows = [],
        options = {}
    ) {
        if (
            typeof container === "string"
        ) {
            container =
                document.querySelector(
                    container
                );
        }

        if (
            !container ||
            !(container instanceof HTMLElement)
        ) {
            return null;
        }

        if (!Array.isArray(columns)) {
            columns = [];
        }

        if (!Array.isArray(rows)) {
            rows = [];
        }

        container.innerHTML =
            buildTableHtml(
                columns,
                rows,
                options
            );

        return container.querySelector(
            "table"
        );
    }

    function createTable(
        columns = [],
        rows = [],
        options = {}
    ) {
        const wrapper =
            document.createElement("div");

        wrapper.className =
            "table-wrapper";

        wrapper.innerHTML =
            buildTableHtml(
                columns,
                rows,
                options
            );

        return wrapper;
    }

    function update(
        tableOrContainer,
        columns = [],
        rows = [],
        options = {}
    ) {
        let container =
            tableOrContainer;

        if (
            typeof container === "string"
        ) {
            container =
                document.querySelector(
                    container
                );
        }

        if (
            !container ||
            !(container instanceof HTMLElement)
        ) {
            return null;
        }

        const target =
            container.tagName === "TABLE"
                ? container.parentElement
                : container;

        if (!target) {
            return null;
        }

        return render(
            target,
            columns,
            rows,
            options
        );
    }

    function getRowCount(rows = []) {
        return Array.isArray(rows)
            ? rows.length
            : 0;
    }

    function sortRows(
        rows = [],
        field,
        direction = "asc"
    ) {
        if (!Array.isArray(rows)) {
            return [];
        }

        if (!field) {
            return [...rows];
        }

        const multiplier =
            direction === "desc"
                ? -1
                : 1;

        return [...rows].sort(
            (first, second) => {
                const firstValue =
                    field
                        .split(".")
                        .reduce(
                            (
                                current,
                                key
                            ) =>
                                current?.[key],
                            first
                        );

                const secondValue =
                    field
                        .split(".")
                        .reduce(
                            (
                                current,
                                key
                            ) =>
                                current?.[key],
                            second
                        );

                if (
                    firstValue ===
                    secondValue
                ) {
                    return 0;
                }

                if (
                    firstValue ===
                        null ||
                    firstValue ===
                        undefined ||
                    firstValue === ""
                ) {
                    return -1 *
                        multiplier;
                }

                if (
                    secondValue ===
                        null ||
                    secondValue ===
                        undefined ||
                    secondValue === ""
                ) {
                    return 1 *
                        multiplier;
                }

                const firstNumber =
                    Number(
                        firstValue
                    );

                const secondNumber =
                    Number(
                        secondValue
                    );

                if (
                    Number.isFinite(
                        firstNumber
                    ) &&
                    Number.isFinite(
                        secondNumber
                    )
                ) {
                    return (
                        firstNumber -
                        secondNumber
                    ) * multiplier;
                }

                return String(
                    firstValue
                )
                    .localeCompare(
                        String(
                            secondValue
                        ),
                        undefined,
                        {
                            numeric: true,
                            sensitivity:
                                "base"
                        }
                    ) * multiplier;
            }
        );
    }

    function filterRows(
        rows = [],
        predicate
    ) {
        if (!Array.isArray(rows)) {
            return [];
        }

        if (
            typeof predicate !==
            "function"
        ) {
            return [...rows];
        }

        return rows.filter(
            predicate
        );
    }

    window.RESQ_TABLES =
        Object.freeze({
            render,
            createTable,
            update,
            getRowCount,
            sortRows,
            filterRows
        });
})();